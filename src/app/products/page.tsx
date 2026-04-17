'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLocaleStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, formatNumber } from '@/lib/utils';
import {
  BreadcrumbNav,
  Pagination,
  ProductCard,
  ProductSkeletonCard,
  EmptyState,
} from '@/components/shared';
import type { ProductCardData } from '@/components/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Package,
  ArrowLeft,
  ArrowRight,
  Star,
  X,
  Loader2,
  RotateCcw,
} from 'lucide-react';

const ITEMS_PER_PAGE = 12;

interface Category {
  id: string;
  name: string;
  name_en: string;
  slug: string;
  icon?: string;
}

interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  name_en: string;
  slug: string;
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy" />
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';

  const { locale } = useLocaleStore();
  const t = getTranslation(locale);
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedSubcategory, setSelectedSubcategory] = useState(
    subcategoryParam
  );
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('id, name, name_en, slug, icon')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (data) setCategories(data);
    }
    fetchCategories();
  }, []);

  // Fetch subcategories when category changes
  useEffect(() => {
    async function fetchSubcategories() {
      if (!selectedCategory) {
        setSubcategories([]);
        setSelectedSubcategory('');
        return;
      }
      const cat = categories.find((c) => c.slug === selectedCategory);
      if (!cat) return;
      const { data } = await supabase
        .from('subcategories')
        .select('id, category_id, name, name_en, slug')
        .eq('category_id', cat.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      setSubcategories(data || []);
    }
    fetchSubcategories();
  }, [selectedCategory, categories]);

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      let query = supabase
        .from('products')
        .select('*, suppliers!inner(name, name_en, id)', { count: 'exact' })
        .eq('status', 'active');

      if (selectedCategory) {
        const cat = categories.find((c) => c.slug === selectedCategory);
        if (cat) query = query.eq('category_id', cat.id);
      }

      if (selectedSubcategory) {
        const sub = subcategories.find(
          (s) => s.slug === selectedSubcategory
        );
        if (sub) query = query.eq('subcategory_id', sub.id);
      }

      if (searchQuery.trim()) {
        query = query.or(
          `name.ilike.%${searchQuery}%,name_en.ilike.%${searchQuery}%`
        );
      }

      if (inStockOnly) query = query.eq('in_stock', true);
      if (minPrice) query = query.gte('price', parseFloat(minPrice));
      if (maxPrice) query = query.lte('price', parseFloat(maxPrice));

      // Get product images for each product
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      // Sort
      switch (sortBy) {
        case 'priceLow':
          query = query.order('price', { ascending: true });
          break;
        case 'priceHigh':
          query = query.order('price', { ascending: false });
          break;
        case 'rating':
          query = query.order('total_sales', { ascending: false });
          break;
        case 'sales':
          query = query.order('total_sales', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      query = query.range(from, to);

      const { data, count } = await query;

      if (data) {
        // Fetch primary images for products
        const productIds = data.map((p) => p.id);
        const { data: images } = await supabase
          .from('product_images')
          .select('product_id, url, is_primary')
          .eq('is_primary', true)
          .in('product_id', productIds);

        const imageMap = new Map<string, string>();
        if (images) {
          images.forEach((img) => {
            if (!imageMap.has(img.product_id)) {
              imageMap.set(img.product_id, img.url);
            }
          });
        }

        const supplierMap = new Map<string, string>();
        data.forEach((p) => {
          const supplier = p.suppliers as unknown as {
            name: string;
            name_en: string;
            id: string;
          };
          if (supplier) {
            supplierMap.set(p.supplier_id, supplier.name);
          }
        });

        const mapped: ProductCardData[] = data.map((p) => ({
          id: p.id,
          supplierId: p.supplier_id,
          supplierName: supplierMap.get(p.supplier_id) || '',
          name: p.name,
          nameEn: p.name_en || undefined,
          price: p.price,
          currency: p.currency,
          imageUrl: imageMap.get(p.id) || undefined,
          description: p.description || undefined,
          inStock: p.in_stock,
          minOrder: p.min_order,
          unit: p.unit,
          isFeatured: p.is_featured,
          totalSales: p.total_sales,
        }));

        setProducts(mapped);
        setTotal(count || 0);
      }
      setLoading(false);
    }
    fetchProducts();
  }, [
    selectedCategory,
    selectedSubcategory,
    searchQuery,
    minPrice,
    maxPrice,
    inStockOnly,
    sortBy,
    currentPage,
    categories,
    subcategories,
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedSubcategory('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating(0);
    setInStockOnly(false);
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategory ||
    selectedSubcategory ||
    minPrice ||
    maxPrice ||
    minRating > 0 ||
    inStockOnly ||
    searchQuery;

  const renderFilters = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {locale === 'ar' ? 'التصنيف' : 'Categorie'}
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          <button
            onClick={() => {
              setSelectedCategory('');
              setSelectedSubcategory('');
              setCurrentPage(1);
            }}
            className={cn(
              'w-full text-start px-3 py-2 rounded-lg text-sm transition-colors',
              !selectedCategory
                ? 'bg-navy/5 text-navy font-medium'
                : 'text-[var(--text-secondary)] hover:bg-muted'
            )}
          >
            {locale === 'ar' ? 'الكل' : 'Toutes'}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.slug);
                setSelectedSubcategory('');
                setCurrentPage(1);
              }}
              className={cn(
                'w-full text-start px-3 py-2 rounded-lg text-sm transition-colors',
                selectedCategory === cat.slug
                  ? 'bg-navy/5 text-navy font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-muted'
              )}
            >
              {locale === 'fr' ? cat.name_en : cat.name}
              <span className="text-xs text-muted-foreground ms-1">
                ({cat.slug})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Subcategories */}
      {selectedCategory && subcategories.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {locale === 'ar' ? 'القسم الفرعي' : 'Sous-categorie'}
          </h3>
          <div className="space-y-1 max-h-36 overflow-y-auto">
            <button
              onClick={() => {
                setSelectedSubcategory('');
                setCurrentPage(1);
              }}
              className={cn(
                'w-full text-start px-3 py-2 rounded-lg text-sm transition-colors',
                !selectedSubcategory
                  ? 'bg-navy/5 text-navy font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-muted'
              )}
            >
              {locale === 'ar' ? 'الكل' : 'Toutes'}
            </button>
            {subcategories.map((sub) => (
              <button
                key={sub.id}
                onClick={() => {
                  setSelectedSubcategory(sub.slug);
                  setCurrentPage(1);
                }}
                className={cn(
                  'w-full text-start px-3 py-2 rounded-lg text-sm transition-colors',
                  selectedSubcategory === sub.slug
                    ? 'bg-navy/5 text-navy font-medium'
                    : 'text-[var(--text-secondary)] hover:bg-muted'
                )}
              >
                {locale === 'fr' ? sub.name_en : sub.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t.products.priceRange}
        </h3>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder={t.products.minPrice}
            value={minPrice}
            onChange={(e) => {
              setMinPrice(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 text-sm"
            dir="ltr"
          />
          <span className="text-muted-foreground text-sm">-</span>
          <Input
            type="number"
            placeholder={t.products.maxPrice}
            value={maxPrice}
            onChange={(e) => {
              setMaxPrice(e.target.value);
              setCurrentPage(1);
            }}
            className="h-9 text-sm"
            dir="ltr"
          />
        </div>
      </div>

      {/* Rating */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {t.products.sortRating}
        </h3>
        <div className="space-y-1">
          {[0, 3, 3.5, 4, 4.5].map((rating) => (
            <button
              key={rating}
              onClick={() => {
                setMinRating(rating);
                setCurrentPage(1);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                minRating === rating
                  ? 'bg-navy/5 text-navy font-medium'
                  : 'text-[var(--text-secondary)] hover:bg-muted'
              )}
            >
              {rating === 0 ? (
                <span>
                  {locale === 'ar' ? 'الكل' : 'Toutes'}
                </span>
              ) : (
                <div className="flex items-center gap-0.5">
                  <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                  <span>{rating}+</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* In Stock */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="instock"
          checked={inStockOnly}
          onCheckedChange={(checked) => {
            setInStockOnly(checked === true);
            setCurrentPage(1);
          }}
        />
        <Label htmlFor="instock" className="text-sm cursor-pointer">
          {t.products.inStock}
        </Label>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="outline"
          size="sm"
          className="w-full rounded-lg"
          onClick={clearFilters}
        >
          <RotateCcw className="w-3.5 h-3.5 me-1.5" />
          {t.products.clearFilters}
        </Button>
      )}
    </div>
  );

  const sortOptions = [
    { value: 'newest', label: t.products.sortNewest },
    { value: 'priceLow', label: t.products.sortPriceLow },
    { value: 'priceHigh', label: t.products.sortPriceHigh },
    { value: 'rating', label: t.products.sortRating },
    { value: 'sales', label: t.products.bestSelling },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      {/* Header */}
      <div className="gradient-navy-soft text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbNav
            items={[
              { label: t.products.title },
              ...(selectedCategory
                ? [
                    {
                      label:
                        categories.find((c) => c.slug === selectedCategory)
                          ?.name || selectedCategory,
                    },
                  ]
                : []),
            ]}
            className="text-white/60 mb-4 [&_a]:hover:text-white/90 [&_a]:text-white/60 [&_span]:text-white/90"
          />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
              <Package className="w-5.5 h-5.5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t.products.allProducts}
              </h1>
              <p className="text-white/60 text-sm mt-0.5">
                {formatNumber(total, locale)} {t.products.resultsCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute end-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t.products.searchPlaceholder}
            className="h-12 pe-12 ps-4 bg-white border-border rounded-xl text-sm"
            dir="auto"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            {/* Mobile Filter Toggle */}
            <Sheet
              open={mobileFiltersOpen}
              onOpenChange={setMobileFiltersOpen}
            >
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="lg:hidden rounded-lg"
                >
                  <SlidersHorizontal className="w-4 h-4 me-1.5" />
                  {t.products.filters}
                  {hasActiveFilters && (
                    <Badge className="bg-navy text-white ms-1.5 text-[10px] px-1.5 py-0">
                      !
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="end" className="w-80 p-6 overflow-y-auto">
                <SheetTitle className="sr-only">
                  {t.products.filters}
                </SheetTitle>
                <h2 className="text-lg font-bold mb-6">{t.products.filters}</h2>
                {renderFilters()}
              </SheetContent>
            </Sheet>

            {/* Active Filters Tags */}
            {hasActiveFilters && (
              <div className="hidden sm:flex items-center gap-1.5">
                {selectedCategory && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => {
                      setSelectedCategory('');
                      setSelectedSubcategory('');
                      setCurrentPage(1);
                    }}
                  >
                    {categories.find((c) => c.slug === selectedCategory)?.name ||
                      selectedCategory}
                    <X className="w-3 h-3 ms-1" />
                  </Badge>
                )}
                {inStockOnly && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => setInStockOnly(false)}
                  >
                    {t.products.inStock}
                    <X className="w-3 h-3 ms-1" />
                  </Badge>
                )}
                {minPrice && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => setMinPrice('')}
                  >
                    {'>='} {minPrice}
                    <X className="w-3 h-3 ms-1" />
                  </Badge>
                )}
                {maxPrice && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => setMaxPrice('')}
                  >
                    {'<='} {maxPrice}
                    <X className="w-3 h-3 ms-1" />
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs"
                  onClick={clearFilters}
                >
                  <RotateCcw className="w-3 h-3 me-1" />
                  {t.products.clearFilters}
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="h-9 px-3 text-sm border border-border rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-navy/20"
            >
              {sortOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white shadow-sm text-navy'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-white shadow-sm text-navy'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 bg-white rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4" />
                  {t.products.filters}
                </h2>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-navy hover:underline"
                  >
                    {t.products.clearFilters}
                  </button>
                )}
              </div>
              {renderFilters()}
            </div>
          </aside>

          {/* Products */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div
                className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4'
                    : 'space-y-3'
                }
              >
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <ProductSkeletonCard key={i} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                icon={Package}
                title={t.products.noProducts}
                description={t.products.noProductsDesc}
                actionLabel={t.products.clearFilters}
                onAction={clearFilters}
              />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {products.map((product) => (
                  <ProductListItem key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* Pagination */}
            {!loading && products.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                className="mt-8"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductListItem({ product }: { product: ProductCardData }) {
  const { locale } = useLocaleStore();
  const { formatPrice: storeFormatPrice } = useCurrencyStore();

  const displayName =
    locale === 'fr' && product.nameEn ? product.nameEn : product.name;

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="bg-white rounded-xl border border-border hover:border-navy/20 hover:shadow-[var(--shadow-md)] transition-all p-4 flex gap-4">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-muted overflow-hidden shrink-0">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[11px] text-[var(--text-secondary)] font-medium">
              {product.supplierName}
            </span>
            {!product.inStock && (
              <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0 border-0">
                {locale === 'ar' ? 'غير متوفر' : 'Rupture'}
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-foreground text-sm sm:text-base line-clamp-1 group-hover:text-navy transition-colors">
            {displayName}
          </h3>
          {product.description && (
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-1 leading-relaxed">
              {product.description}
            </p>
          )}
          <div className="mt-auto pt-2 flex items-end justify-between">
            <div>
              <p className="text-base sm:text-lg font-bold text-navy">
                {storeFormatPrice(product.price)}
              </p>
              {product.minOrder && product.minOrder > 1 && (
                <p className="text-[10px] text-[var(--text-secondary)]">
                  {locale === 'ar'
                    ? `الحد الأدنى: ${product.minOrder}`
                    : `Min: ${product.minOrder}`}
                  {product.unit ? ` ${product.unit}` : ''}
                </p>
              )}
            </div>
            <Badge variant="secondary" className="text-xs">
              {locale === 'ar' ? 'عرض التفاصيل' : 'Voir'}
            </Badge>
          </div>
        </div>
      </div>
    </Link>
  );
}
