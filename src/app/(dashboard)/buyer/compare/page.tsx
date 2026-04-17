'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocaleStore, useCurrencyStore } from '@/lib/store';
import { cn, formatPrice } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared';
import {
  GitCompareArrows,
  X,
  Plus,
  Package,
  Star,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

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
}

const COMPARE_KEY = 'businfo_compare_products';

function getStoredCompare(): CompareProduct[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(COMPARE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function setStoredCompare(products: CompareProduct[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(COMPARE_KEY, JSON.stringify(products));
}

export default function BuyerComparePage() {
  const { locale } = useLocaleStore();
  const { formatPrice: storeFormatPrice } = useCurrencyStore();
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  const [products, setProducts] = useState<CompareProduct[]>(() => getStoredCompare());

  const clearAll = () => {
    setProducts([]);
    setStoredCompare([]);
  };

  const removeProduct = (id: string) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    setStoredCompare(updated);
  };

  const getDisplayName = (p: CompareProduct) =>
    locale === 'fr' && p.nameEn ? p.nameEn : p.name;

  const getDisplayDesc = (p: CompareProduct) =>
    locale === 'fr' && p.descriptionEn ? p.descriptionEn : p.description || '-';

  const compareRows = [
    {
      label: locale === 'ar' ? 'السعر' : 'Prix',
      render: (p: CompareProduct) => (
        <span className="font-bold text-navy text-sm">{storeFormatPrice(p.price)}</span>
      ),
    },
    {
      label: locale === 'ar' ? 'المورد' : 'Fournisseur',
      render: (p: CompareProduct) =>
        p.supplierName ? (
          <Link href={`/supplier/${p.supplierId}`} className="text-navy hover:underline text-sm font-medium">
            {p.supplierName}
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">-</span>
        ),
    },
    {
      label: locale === 'ar' ? 'التقييم' : 'Note',
      render: (p: CompareProduct) => (
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span className="text-sm">{p.rating?.toFixed(1) || '0.0'}</span>
          {p.reviewCount && p.reviewCount > 0 && (
            <span className="text-xs text-muted-foreground">({p.reviewCount})</span>
          )}
        </div>
      ),
    },
    {
      label: locale === 'ar' ? 'المخزون' : 'Stock',
      render: (p: CompareProduct) =>
        p.inStock ? (
          <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full">
            <CheckCircle2 className="w-3 h-3" />
            {locale === 'ar' ? 'متوفر' : 'En stock'}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-red-600 text-xs font-medium bg-red-50 px-2 py-1 rounded-full">
            <X className="w-3 h-3" />
            {locale === 'ar' ? 'غير متوفر' : 'Rupture'}
          </span>
        ),
    },
    {
      label: locale === 'ar' ? 'الحد الأدنى للطلب' : 'Commande min.',
      render: (p: CompareProduct) => (
        <span className="text-sm">{p.minOrder || 1} {p.unit || ''}</span>
      ),
    },
    {
      label: locale === 'ar' ? 'الوصف' : 'Description',
      render: (p: CompareProduct) => (
        <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed max-w-48">
          {getDisplayDesc(p)}
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {locale === 'ar' ? 'المقارنات' : 'Comparaisons'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {products.length}/4 {locale === 'ar' ? 'منتجات' : 'produits'}
          </p>
        </div>
        <div className="flex gap-2">
          {products.length > 0 && (
            <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={clearAll}>
              <Trash2 className="w-4 h-4 me-1.5" />
              {locale === 'ar' ? 'مسح الكل' : 'Tout effacer'}
            </Button>
          )}
          <Button asChild size="sm" className="bg-navy hover:bg-navy-light text-white">
            <Link href="/compare" className="flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              {locale === 'ar' ? 'إضافة منتج' : 'Ajouter'}
            </Link>
          </Button>
        </div>
      </div>

      {/* Empty State */}
      {products.length === 0 ? (
        <EmptyState
          icon={GitCompareArrows}
          title={locale === 'ar' ? 'لا توجد منتجات للمقارنة' : 'Aucun produit a comparer'}
          description={
            locale === 'ar'
              ? 'أضف منتجات من صفحة المنتجات للمقارنة بينها'
              : 'Ajoutez des produits depuis la page des produits pour les comparer'
          }
          actionLabel={locale === 'ar' ? 'تصفح المنتجات' : 'Parcourir les produits'}
          actionHref="/products"
        />
      ) : (
        <div className="overflow-x-auto">
          <Card className="border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="w-36 ps-4 pe-3 py-4 text-start text-xs font-semibold text-muted-foreground bg-muted/50">
                    {locale === 'ar' ? 'المعايير' : 'Criteres'}
                  </th>
                  {products.map((p) => (
                    <th key={p.id} className="p-4 text-center bg-white border-s border-border min-w-48">
                      <div className="relative inline-block">
                        <div className="w-20 h-20 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2 overflow-hidden">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={getDisplayName(p)} className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-8 h-8 text-muted-foreground/40" />
                          )}
                        </div>
                        <Link href={`/products/${p.id}`} className="text-sm font-semibold text-foreground hover:text-navy line-clamp-2 leading-snug block">
                          {getDisplayName(p)}
                        </Link>
                        <button
                          onClick={() => removeProduct(p.id)}
                          className="absolute -top-1 -end-1 w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center hover:bg-red-200 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </th>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
                    <th key={`empty-${i}`} className="p-4 text-center border-s border-border">
                      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center mx-auto mb-2">
                        <Plus className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compareRows.map((row, idx) => (
                  <tr key={idx} className={cn('border-t border-border', idx % 2 === 0 ? 'bg-white' : 'bg-muted/20')}>
                    <td className="ps-4 pe-3 py-3 text-xs font-semibold text-muted-foreground whitespace-nowrap">
                      {row.label}
                    </td>
                    {products.map((p) => (
                      <td key={p.id} className="p-3 text-center border-s border-border">
                        {row.render(p)}
                      </td>
                    ))}
                    {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
                      <td key={`empty-${idx}-${i}`} className="p-3 text-center text-muted-foreground/40 border-s border-border">
                        -
                      </td>
                    ))}
                  </tr>
                ))}
                <tr className="border-t border-border">
                  <td className="ps-4 pe-3 py-3 text-xs font-semibold text-muted-foreground">
                    {locale === 'ar' ? 'إجراء' : 'Action'}
                  </td>
                  {products.map((p) => (
                    <td key={p.id} className="p-3 text-center border-s border-border">
                      <Button size="sm" className="rounded-lg text-xs" asChild>
                        <Link href={`/products/${p.id}`}>
                          {locale === 'ar' ? 'عرض التفاصيل' : 'Voir details'}
                        </Link>
                      </Button>
                    </td>
                  ))}
                  {Array.from({ length: Math.max(0, 4 - products.length) }).map((_, i) => (
                    <td key={`action-empty-${i}`} className="p-3 border-s border-border" />
                  ))}
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  );
}
