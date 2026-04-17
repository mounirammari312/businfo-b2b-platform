'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useLocaleStore } from '@/lib/store';
import { getTranslation } from '@/lib/i18n';
import { cn, formatNumber } from '@/lib/utils';
import { BreadcrumbNav } from '@/components/shared';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  HardHat,
  Zap,
  UtensilsCrossed,
  Shirt,
  FlaskConical,
  Laptop,
  Stethoscope,
  Car,
  Sofa,
  Wheat,
  Box,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Package,
  Layers,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ElementType> = {
  HardHat,
  Zap,
  UtensilsCrossed,
  Shirt,
  FlaskConical,
  Laptop,
  Stethoscope,
  Car,
  Sofa,
  Wheat,
  Box,
  Sparkles,
  Package,
  Layers,
};

interface CategoryData {
  id: string;
  name: string;
  name_en: string;
  slug: string;
  icon?: string;
  image_url?: string;
  product_count?: number;
  subcategories?: SubcategoryData[];
}

interface SubcategoryData {
  id: string;
  name: string;
  name_en: string;
  slug: string;
  icon?: string;
  product_count?: number;
}

export default function CategoriesPage() {
  const { locale } = useLocaleStore();
  const t = getTranslation(locale);
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;
  const ChevronIcon = isRtl ? ChevronLeft : ChevronRight;

  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        const cats: CategoryData[] = await Promise.all(
          data.map(async (cat) => {
            const { data: subs } = await supabase
              .from('subcategories')
              .select('*')
              .eq('category_id', cat.id)
              .eq('is_active', true)
              .order('sort_order', { ascending: true });

            const { count } = await supabase
              .from('products')
              .select('id', { count: 'exact', head: true })
              .eq('category_id', cat.id)
              .eq('status', 'active');

            return {
              id: cat.id,
              name: cat.name,
              name_en: cat.name_en,
              slug: cat.slug,
              icon: cat.icon,
              image_url: cat.image_url,
              product_count: count || 0,
              subcategories: (subs || []).map((sub) => ({
                id: sub.id,
                name: sub.name,
                name_en: sub.name_en,
                slug: sub.slug,
                icon: sub.icon,
              })),
            };
          })
        );
        setCategories(cats);
      }
      setLoading(false);
    }
    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-light)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="skeleton-shimmer h-5 w-48 mb-8" />
          <div className="skeleton-shimmer h-10 w-64 mb-6" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-32 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-light)]">
      {/* Header */}
      <div className="gradient-navy-soft text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <BreadcrumbNav
            items={[{ label: t.categories.title }]}
            className="text-white/60 mb-4 [&_a]:hover:text-white/90 [&_a]:text-white/60 [&_span]:text-white/90"
          />
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
              <Layers className="w-5.5 h-5.5 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {t.categories.allCategories}
              </h1>
              <p className="text-white/60 text-sm mt-0.5">
                {locale === 'ar'
                  ? 'تصفح جميع فئات المنتجات والخدمات'
                  : 'Parcourez toutes les categories de produits et services'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="flex items-center gap-4 mb-6 text-sm text-[var(--text-secondary)]">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
            {categories.length}{' '}
            {locale === 'ar' ? 'تصنيف' : 'categories'}
          </Badge>
          <span>
            {formatNumber(
              categories.reduce((sum, c) => sum + (c.product_count || 0), 0),
              locale
            )}{' '}
            {locale === 'ar' ? 'منتج' : 'produits'}
          </span>
        </div>

        {/* Categories Accordion */}
        <div className="space-y-3">
          {categories.map((category) => {
            const IconComponent =
              (category.icon && ICON_MAP[category.icon]) || Package;
            const isExpanded = expandedCategory === category.id;
            const displayName =
              locale === 'fr' ? category.name_en : category.name;
            const hasSubcategories =
              category.subcategories && category.subcategories.length > 0;

            return (
              <Card
                key={category.id}
                className="border border-border hover:border-navy/10 transition-colors overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4 sm:p-5">
                  <div className="w-12 h-12 rounded-xl bg-navy/5 flex items-center justify-center shrink-0">
                    <IconComponent className="w-6 h-6 text-navy" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm sm:text-base">
                      {displayName}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {category.subcategories?.length || 0}{' '}
                      {locale === 'ar'
                        ? 'أقسام فرعية'
                        : 'sous-categories'}
                      {' · '}
                      {formatNumber(category.product_count || 0, locale)}{' '}
                      {locale === 'ar' ? 'منتج' : 'produits'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-lg text-xs"
                      asChild
                    >
                      <Link href={`/products?category=${category.slug}`}>
                        {locale === 'ar' ? 'عرض المنتجات' : 'Voir'}
                        <ArrowIcon className="w-3.5 h-3.5 ms-1" />
                      </Link>
                    </Button>
                    {hasSubcategories && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-lg"
                        onClick={() =>
                          setExpandedCategory(
                            isExpanded ? null : category.id
                          )
                        }
                      >
                        <ChevronDown
                          className={cn(
                            'w-4 h-4 transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </Button>
                    )}
                  </div>
                </div>

                {isExpanded && hasSubcategories && (
                  <div className="border-t border-border bg-muted/30 px-4 sm:px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories!.map((sub) => {
                        const SubIcon =
                          (sub.icon && ICON_MAP[sub.icon]) || Layers;
                        const subDisplayName =
                          locale === 'fr' ? sub.name_en : sub.name;
                        return (
                          <Link
                            key={sub.id}
                            href={`/products?subcategory=${sub.slug}`}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-border hover:border-navy/20 hover:shadow-sm transition-all text-xs font-medium text-foreground group"
                          >
                            <SubIcon className="w-3.5 h-3.5 text-[var(--text-secondary)] group-hover:text-navy transition-colors" />
                            {subDisplayName}
                            <ChevronIcon className="w-3 h-3 text-muted-foreground/50" />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-20">
            <Layers className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {t.empty.noProducts}
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {t.empty.noProductsDesc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
