'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLocaleStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, formatNumber } from '@/lib/utils';
import {
  BreadcrumbNav,
  Pagination,
  SupplierCard,
  SupplierSkeletonCard,
  EmptyState,
} from '@/components/shared';
import type { SupplierCardData } from '@/components/shared';
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
  Star,
  Building2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  RotateCcw,
  X,
} from 'lucide-react';

const ITEMS_PER_PAGE = 9;

interface CategoryOption {
  id: string;
  name: string;
  name_en: string;
  slug: string;
}

export default function SuppliersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-navy" />
        </div>
      }
    >
      <SuppliersContent />
    </Suspense>
  );
}

function SuppliersContent() {
  const searchParams = useSearchParams();
  const searchParam = searchParams.get('search') || '';
  const categoryParam = searchParams.get('category') || '';

  const { locale } = useLocaleStore();
  const t = getTranslation(locale);
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [suppliers, setSuppliers] = useState<SupplierCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [minRating, setMinRating] = useState<number>(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('rating');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch categories
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase
        .from('categories')
        .select('id, name, name_en, slug')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (data) {
        setCategories(data);
      }
    }
    fetchCategories();
  }, []);

  // Fetch suppliers
  useEffect(() => {
    async function fetchSuppliers() {
      setLoading(true);

      let query = supabase
        .from('suppliers')
        .select('*', { count: 'exact' })
        .eq('status', 'active');

      if (verifiedOnly) query = query.eq('is_verified', true);
      if (minRating > 0) query = query.gte('rating', minRating);

      // Sort
      switch (sortBy) {
        case 'rating':
          query = query.order('rating', { ascending: false });
          break;
        case 'products':
          query = query.order('product_count', { ascending: false });
          break;
        case 'views':
          query = query.order('views', { ascending: false });
          break;
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('rating', { ascending: false });
      }

      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, count } = await query;

      if (data) {
        // Fetch badges for each supplier
        const supplierIds = data.map((s) => s.id);
        const { data: badges } = await supabase
          .from('supplier_badges')
          .select('supplier_id, badge_type_id, is_active')
          .eq('is_active', true)
          .in('supplier_id', supplierIds);

        const { data: badgeTypes } = await supabase
          .from('badge_types')
          .select('id, slug')
          .eq('is_active', true);

        const badgeTypeMap = new Map<string, string>();
        if (badgeTypes) {
          badgeTypes.forEach((bt) => badgeTypeMap.set(bt.id, bt.slug));
        }

        const supplierBadgeMap = new Map<string, string[]>();
        if (badges) {
          badges.forEach((b) => {
            const existing = supplierBadgeMap.get(b.supplier_id) || [];
            const slug = badgeTypeMap.get(b.badge_type_id);
            if (slug) existing.push(slug);
            supplierBadgeMap.set(b.supplier_id, existing);
          });
        }

        const mapped: SupplierCardData[] = data.map((s) => ({
          id: s.id,
          name: s.name,
          nameEn: s.name_en || undefined,
          description: s.description || undefined,
          descriptionEn: s.description_en || undefined,
          logoUrl: s.logo_url || undefined,
          coverUrl: s.cover_url || undefined,
          category: s.category || undefined,
          city: s.city || undefined,
          rating: s.rating || 0,
          reviewCount: s.review_count || 0,
          productCount: s.product_count || 0,
          views: s.views || 0,
          isVerified: s.is_verified || false,
          badges: supplierBadgeMap.get(s.id) || [],
        }));

        // Client-side filters for category (since category is a text field)
        let filtered = mapped;
        if (selectedCategory) {
          // Match category slug to supplier category
          // The supplier.category is a text field, we need to match it
          // For now, this is a best-effort match
          filtered = filtered.filter((s) => {
            if (!s.category) return false;
            return s.category
              .toLowerCase()
              .includes(selectedCategory.toLowerCase());
          });
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (s) =>
              s.name.toLowerCase().includes(q) ||
              (s.nameEn && s.nameEn.toLowerCase().includes(q)) ||
              (s.description && s.description.toLowerCase().includes(q)) ||
              (s.city && s.city.toLowerCase().includes(q))
          );
        }

        setSuppliers(filtered);
        setTotal(count || 0);
      } else {
        setSuppliers([]);
        setTotal(0);
      }
      setLoading(false);
    }
    fetchSuppliers();
  }, [
    searchQuery,
    selectedCategory,
    minRating,
    verifiedOnly,
    sortBy,
    currentPage,
    categories,
  ]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setMinRating(0);
    setVerifiedOnly(false);
    setSortBy('rating');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategory || minRating > 0 || verifiedOnly || searchQuery;

  const sortOptions = [
    { value: 'rating', label: t.products.sortRating },
    { value: 'products', label: locale === 'ar' ? 'الأكثر منتجات' : 'Plus de produits' },
    { value: 'views', label: locale === 'ar' ? 'الأكثر مشاهدة' : 'Plus vus' },
    { value: 'newest', label: t.products.sortNewest },
  ];

  const renderFilters = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          {locale === 'ar' ? 'التصنيف' : 'Categorie'}
        </h3>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          <button
            onClick={() => {
              setSelectedCategory('');
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
            </button>
          ))}
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
                <span>{locale === 'ar' ? 'الكل' : 'Toutes'}</span>
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

      {/* Verified Only */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="verified"
          checked={verifiedOnly}
          onCheckedChange={(checked) => {
            setVerifiedOnly(checked === true);
            setCurrentPage(1);
          }}
        />
        <Label htmlFor="verified" className="text-sm cursor-pointer">
          {t.suppliers.verified}
        </Label>
      </div>

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

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      {/* Header */}
      <div className="gradient-navy-soft text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbNav
            items={[{ label: t.suppliers.title }]}
            className="text-white/60 mb-4 [&_a]:hover:text-white/90 [&_a]:text-white/60 [&_span]:text-white/90"
          />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
              <Building2 className="w-5.5 h-5.5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t.suppliers.allSuppliers}
              </h1>
              <p className="text-white/60 text-sm mt-0.5">
                {formatNumber(total, locale)}{' '}
                {t.suppliers.title}
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
            placeholder={t.suppliers.searchPlaceholder}
            className="h-12 pe-12 ps-4 bg-white border-border rounded-xl text-sm"
            dir="auto"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            {/* Mobile Filter Toggle */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
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
                <SheetTitle className="sr-only">{t.products.filters}</SheetTitle>
                <h2 className="text-lg font-bold mb-6">{t.products.filters}</h2>
                {renderFilters()}
              </SheetContent>
            </Sheet>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="hidden sm:flex items-center gap-1.5">
                {selectedCategory && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => {
                      setSelectedCategory('');
                      setCurrentPage(1);
                    }}
                  >
                    {categories.find((c) => c.slug === selectedCategory)?.name ||
                      selectedCategory}
                    <X className="w-3 h-3 ms-1" />
                  </Badge>
                )}
                {verifiedOnly && (
                  <Badge
                    variant="secondary"
                    className="text-xs cursor-pointer"
                    onClick={() => setVerifiedOnly(false)}
                  >
                    {t.suppliers.verified}
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

          {/* Suppliers */}
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
                  <SupplierSkeletonCard key={i} />
                ))}
              </div>
            ) : suppliers.length === 0 ? (
              <EmptyState
                icon={Building2}
                title={t.suppliers.noSuppliers}
                description={t.suppliers.noSuppliersDesc}
                actionLabel={t.products.clearFilters}
                onAction={clearFilters}
              />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {suppliers.map((supplier) => (
                  <SupplierCard key={supplier.id} supplier={supplier} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {suppliers.map((supplier) => (
                  <SupplierListItem key={supplier.id} supplier={supplier} />
                ))}
              </div>
            )}

            {!loading && suppliers.length > 0 && (
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

function SupplierListItem({ supplier }: { supplier: SupplierCardData }) {
  const { locale } = useLocaleStore();
  const isRtl = locale === 'ar';
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;
  const displayName =
    locale === 'fr' && supplier.nameEn ? supplier.nameEn : supplier.name;
  const displayDesc =
    locale === 'fr' && supplier.descriptionEn
      ? supplier.descriptionEn
      : supplier.description || '';

  return (
    <Link href={`/supplier/${supplier.id}`} className="group block">
      <div className="bg-white rounded-xl border border-border hover:border-navy/20 hover:shadow-[var(--shadow-md)] transition-all p-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-xl bg-muted border border-border overflow-hidden shrink-0 flex items-center justify-center">
          {supplier.logoUrl ? (
            <img
              src={supplier.logoUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-navy font-bold text-lg">
              {displayName.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-navy transition-colors">
              {displayName}
            </h3>
            {supplier.isVerified && (
              <span className="inline-flex items-center gap-0.5 text-green-600 text-[10px] font-medium bg-green-50 px-1.5 py-0.5 rounded-full shrink-0">
                <Star className="w-2.5 h-2.5 fill-green-600 text-green-600" />
                {locale === 'ar' ? 'معتمد' : 'Certifie'}
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mb-1.5">
            {displayDesc}
          </p>
          <div className="flex items-center gap-3 text-[11px] text-[var(--text-secondary)]">
            <span className="flex items-center gap-0.5 text-gold-dark">
              <Star className="w-3 h-3 fill-gold text-gold" />
              {supplier.rating}
            </span>
            <span>{formatNumber(supplier.productCount, locale)} {locale === 'ar' ? 'منتج' : 'produits'}</span>
            {supplier.city && <span>{supplier.city}</span>}
          </div>
        </div>
        <ChevronIcon
          className="w-4 h-4 text-muted-foreground/50 group-hover:text-navy transition-colors shrink-0"
        />
      </div>
    </Link>
  );
}
