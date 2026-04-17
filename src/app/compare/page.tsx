'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useLocaleStore } from '@/lib/store';
import { useCurrencyStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, formatPrice } from '@/lib/utils';
import { BreadcrumbNav, RatingStars } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  X,
  Plus,
  GitCompareArrows,
  Package,
  Star,
  MapPin,
  Layers,
  ShoppingCart,
  Minus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CompareProduct {
  id: string;
  name: string;
  nameEn?: string;
  price: number;
  currency?: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  supplierName?: string;
  supplierId?: string;
  rating?: number;
  reviewCount?: number;
  inStock?: boolean;
  minOrder?: number;
  unit?: string;
  category?: string;
  stockQuantity?: number | null;
}

export default function ComparePage() {
  const { locale } = useLocaleStore();
  const t = getTranslation(locale);
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const { formatPrice: storeFormatPrice } = useCurrencyStore();

  const [products, setProducts] = useState<CompareProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CompareProduct[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = useCallback(
    async (query: string) => {
      setSearchQuery(query);
      if (query.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setSearching(true);
      const { data } = await supabase
        .from('products')
        .select('*, suppliers!inner(name, name_en)')
        .eq('status', 'active')
        .or(`name.ilike.%${query}%,name_en.ilike.%${query}%`)
        .limit(8);

      if (data) {
        const mapped: CompareProduct[] = data.map((p) => ({
          id: p.id,
          name: p.name,
          nameEn: p.name_en || undefined,
          price: p.price,
          currency: p.currency,
          description: p.description || undefined,
          descriptionEn: p.description_en || undefined,
          imageUrl: undefined,
          supplierName:
            (p.suppliers as unknown as { name: string; name_en: string })
              ?.name || '',
          supplierId: p.supplier_id,
          rating: 0,
          reviewCount: 0,
          inStock: p.in_stock,
          minOrder: p.min_order,
          unit: p.unit,
          stockQuantity: p.stock_quantity,
        }));
        // Filter out already added
        const existingIds = new Set(products.map((p) => p.id));
        setSearchResults(mapped.filter((p) => !existingIds.has(p.id)));
      }
      setSearching(false);
    },
    [products]
  );

  const addProduct = (product: CompareProduct) => {
    if (products.length >= 4) {
      toast.error(
        locale === 'ar'
          ? 'يمكنك مقارنة 4 منتجات كحد أقصى'
          : 'Vous pouvez comparer 4 produits maximum'
      );
      return;
    }
    if (products.find((p) => p.id === product.id)) {
      toast.error(
        locale === 'ar' ? 'هذا المنتج مضاف بالفعل' : 'Produit deja ajoute'
      );
      return;
    }
    setProducts((prev) => [...prev, product]);
    setSearchResults((prev) => prev.filter((p) => p.id !== product.id));
    setShowSearch(false);
    setSearchQuery('');
  };

  const removeProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  const getDisplayName = (p: CompareProduct) =>
    locale === 'fr' && p.nameEn ? p.nameEn : p.name;

  const getDisplayDesc = (p: CompareProduct) =>
    locale === 'fr' && p.descriptionEn
      ? p.descriptionEn
      : p.description || '-';

  const compareRows = [
    {
      label: locale === 'ar' ? 'السعر' : 'Prix',
      render: (p: CompareProduct) => (
        <span className="font-bold text-navy text-sm">
          {storeFormatPrice(p.price)}
        </span>
      ),
    },
    {
      label: locale === 'ar' ? 'العملة' : 'Devise',
      render: (p: CompareProduct) => (
        <span className="text-sm">{p.currency || 'DZD'}</span>
      ),
    },
    {
      label: locale === 'ar' ? 'المورد' : 'Fournisseur',
      render: (p: CompareProduct) =>
        p.supplierName ? (
          <Link
            href={`/supplier/${p.supplierId}`}
            className="text-navy hover:underline text-sm font-medium"
          >
            {p.supplierName}
          </Link>
        ) : (
          <span className="text-sm text-[var(--text-secondary)]">-</span>
        ),
    },
    {
      label: locale === 'ar' ? 'التقييم' : 'Note',
      render: (p: CompareProduct) => (
        <RatingStars rating={p.rating || 0} reviewCount={p.reviewCount} size="sm" />
      ),
    },
    {
      label: locale === 'ar' ? 'المخزون' : 'Stock',
      render: (p: CompareProduct) =>
        p.inStock ? (
          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
            {locale === 'ar' ? 'متوفر' : 'En stock'}
            {p.stockQuantity != null && (
              <span className="text-[var(--text-secondary)]">
                ({p.stockQuantity})
              </span>
            )}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full">
            {locale === 'ar' ? 'غير متوفر' : 'Rupture'}
          </span>
        ),
    },
    {
      label: locale === 'ar' ? 'الحد الأدنى للطلب' : 'Commande min.',
      render: (p: CompareProduct) => (
        <span className="text-sm">
          {p.minOrder || 1} {p.unit || ''}
        </span>
      ),
    },
    {
      label: locale === 'ar' ? 'الوصف' : 'Description',
      render: (p: CompareProduct) => (
        <p className="text-xs text-[var(--text-secondary)] line-clamp-3 leading-relaxed">
          {getDisplayDesc(p)}
        </p>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      {/* Header */}
      <div className="gradient-navy-soft text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbNav
            items={[{ label: locale === 'ar' ? 'مقارنة المنتجات' : 'Comparer les produits' }]}
            className="text-white/60 mb-4 [&_a]:hover:text-white/90 [&_a]:text-white/60 [&_span]:text-white/90"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
                <GitCompareArrows className="w-5.5 h-5.5 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">
                  {locale === 'ar' ? 'مقارنة المنتجات' : 'Comparer les produits'}
                </h1>
                <p className="text-white/60 text-sm mt-0.5">
                  {products.length}/4{' '}
                  {locale === 'ar' ? 'منتجات' : 'produits'}
                </p>
              </div>
            </div>
            {products.length < 4 && (
              <Button
                onClick={() => setShowSearch(true)}
                className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm"
              >
                <Plus className="w-4 h-4 me-1.5" />
                {locale === 'ar' ? 'إضافة منتج' : 'Ajouter'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Modal */}
        {showSearch && (
          <Card className="mb-6 border-navy/20 shadow-[var(--shadow-lg)]">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute end-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={
                      locale === 'ar'
                        ? 'ابحث عن منتج للمقارنة...'
                        : 'Rechercher un produit...'
                    }
                    className="pe-10"
                    autoFocus
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowSearch(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border-t border-border pt-3 max-h-64 overflow-y-auto space-y-1">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addProduct(p)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors text-start"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-muted-foreground/50" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {getDisplayName(p)}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {storeFormatPrice(p.price)} · {p.supplierName}
                        </p>
                      </div>
                      <Plus className="w-4 h-4 text-navy shrink-0" />
                    </button>
                  ))}
                </div>
              )}
              {searching && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-5 h-5 border-2 border-navy/20 border-t-navy rounded-full animate-spin" />
                </div>
              )}
              {searchQuery.length >= 2 &&
                !searching &&
                searchResults.length === 0 && (
                  <div className="text-center py-4 text-sm text-[var(--text-secondary)]">
                    {locale === 'ar'
                      ? 'لم يتم العثور على نتائج'
                      : 'Aucun resultat'}
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {products.length === 0 && !showSearch && (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="w-20 h-20 rounded-2xl bg-muted flex items-center justify-center mb-6">
              <GitCompareArrows className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">
              {locale === 'ar'
                ? 'لا توجد منتجات للمقارنة'
                : 'Aucun produit a comparer'}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] max-w-md text-center mb-6 leading-relaxed">
              {locale === 'ar'
                ? 'ابحث عن المنتجات وأضفها لعرض مقارنة تفصيلية بينها'
                : 'Recherchez et ajoutez des produits pour voir une comparaison detaillee'}
            </p>
            <Button
              onClick={() => setShowSearch(true)}
              className="bg-navy hover:bg-navy-light text-white rounded-xl px-6"
            >
              <Plus className="w-4 h-4 me-2" />
              {locale === 'ar' ? 'إضافة منتج' : 'Ajouter un produit'}
            </Button>
          </div>
        )}

        {/* Comparison Table */}
        {products.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-36 ps-3 pe-4 py-3 text-start text-xs font-semibold text-[var(--text-secondary)] bg-muted/50 rounded-se-lg">
                    {locale === 'ar' ? 'المعايير' : 'Criteres'}
                  </th>
                  {products.map((p) => (
                    <th
                      key={p.id}
                      className="p-3 text-center bg-white border-s border-border"
                    >
                      <div className="relative">
                        <div className="w-full aspect-square rounded-xl bg-muted flex items-center justify-center mb-2 max-w-32 mx-auto">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={getDisplayName(p)}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <Package className="w-8 h-8 text-muted-foreground/40" />
                          )}
                        </div>
                        <Link
                          href={`/products/${p.id}`}
                          className="text-sm font-semibold text-foreground hover:text-navy line-clamp-2 leading-snug"
                        >
                          {getDisplayName(p)}
                        </Link>
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="absolute -top-1 -end-1 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors shadow-sm"
                          aria-label="Remove"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                  {/* Pad remaining columns */}
                  {Array.from({
                    length: Math.max(0, 4 - products.length),
                  }).map((_, i) => (
                    <th
                      key={`empty-${i}`}
                      className="p-3 text-center border-s border-border"
                    >
                      <div className="w-full aspect-square rounded-xl border-2 border-dashed border-border flex items-center justify-center max-w-32 mx-auto mb-2">
                        <Plus className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, idx) => (
                  <tr
                    key={idx}
                    className={cn(
                      'border-t border-border',
                      idx % 2 === 0 ? 'bg-white' : 'bg-muted/30'
                    )}
                  >
                    <td className="ps-3 pe-4 py-3 text-xs font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                      {row.label}
                    </td>
                    {products.map((p) => (
                      <td
                        key={p.id}
                        className="p-3 text-center text-sm border-s border-border"
                      >
                        {row.render(p)}
                      </td>
                    ))}
                    {Array.from({
                      length: Math.max(0, 4 - products.length),
                    }).map((_, i) => (
                      <td
                        key={`empty-${idx}-${i}`}
                        className="p-3 text-center text-sm text-muted-foreground/40 border-s border-border"
                      >
                        -
                      </td>
                    ))}
                  </tr>
                ))}
                {/* Action row */}
                <tr className="border-t border-border">
                  <td className="ps-3 pe-4 py-3 text-xs font-semibold text-[var(--text-secondary)]">
                    {locale === 'ar' ? 'إجراء' : 'Action'}
                  </td>
                  {products.map((p) => (
                    <td
                      key={p.id}
                      className="p-3 text-center border-s border-border"
                    >
                      <Button size="sm" className="rounded-lg text-xs" asChild>
                        <Link href={`/products/${p.id}`}>
                          {locale === 'ar' ? 'عرض التفاصيل' : 'Voir details'}
                        </Link>
                      </Button>
                    </td>
                  ))}
                  {Array.from({
                    length: Math.max(0, 4 - products.length),
                  }).map((_, i) => (
                    <td
                      key={`action-empty-${i}`}
                      className="p-3 text-center border-s border-border"
                    />
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
