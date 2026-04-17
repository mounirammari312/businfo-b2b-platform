'use client';

import React from 'react';
import Link from 'next/link';
import { cn, formatPrice, truncateText } from '@/lib/utils';
import { useLocaleStore } from '@/lib/store';
import { useCurrencyStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from './RatingStars';
import { Package, Heart, ShoppingCart } from 'lucide-react';

export interface ProductCardData {
  id: string;
  supplierId: string;
  supplierName: string;
  name: string;
  nameEn?: string;
  price: number;
  currency?: string;
  imageUrl?: string;
  description?: string;
  inStock?: boolean;
  minOrder?: number;
  unit?: string;
  rating?: number;
  reviewCount?: number;
  supplierBadges?: string[];
  isFeatured?: boolean;
  totalSales?: number;
  category?: string;
}

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { locale } = useLocaleStore();
  const { currency, formatPrice: storeFormatPrice } = useCurrencyStore();

  const displayName =
    locale === 'fr' && product.nameEn ? product.nameEn : product.name;

  const displayPrice = storeFormatPrice(product.price);

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <Card
        className={cn(
          'overflow-hidden border border-border hover:border-navy/20 hover:shadow-[var(--shadow-lg)] transition-all duration-300 group-hover:scale-[1.02] h-full flex flex-col',
          className
        )}
      >
        {/* Image */}
        <div className="relative aspect-[4/3] bg-muted overflow-hidden">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground/30" />
            </div>
          )}
          {/* Badges overlay */}
          <div className="absolute top-2 start-2 flex flex-col gap-1">
            {product.isFeatured && (
              <Badge className="bg-gold text-white text-[10px] px-2 py-0.5 border-0 font-medium shadow-sm">
                {locale === 'ar' ? 'مميز' : 'En vedette'}
              </Badge>
            )}
            {!product.inStock && (
              <Badge className="bg-red-500 text-white text-[10px] px-2 py-0.5 border-0 font-medium shadow-sm">
                {locale === 'ar' ? 'غير متوفر' : 'Rupture'}
              </Badge>
            )}
          </div>
          {/* Favorite button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="absolute top-2 end-2 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white hover:scale-110 transition-all"
            aria-label="Add to favorites"
          >
            <Heart className="w-4 h-4 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-3.5 flex flex-col flex-1">
          {/* Supplier */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="w-5 h-5 rounded-full bg-navy/10 flex items-center justify-center shrink-0 overflow-hidden">
              <Package className="w-3 h-3 text-navy" />
            </div>
            <span className="text-[11px] text-[var(--text-secondary)] truncate font-medium">
              {product.supplierName}
            </span>
          </div>

          {/* Name */}
          <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 mb-2 group-hover:text-navy transition-colors min-h-[2.5rem]">
            {displayName}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-xs text-[var(--text-secondary)] line-clamp-1 mb-3 leading-relaxed">
              {truncateText(product.description, 60)}
            </p>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Price & Meta */}
          <div className="pt-2 border-t border-border/50">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-base font-bold text-navy leading-none">
                  {displayPrice}
                </p>
                {product.minOrder && product.minOrder > 1 && (
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">
                    {locale === 'ar'
                      ? `الحد الأدنى: ${product.minOrder}`
                      : `Min: ${product.minOrder}`}
                    {product.unit ? ` ${product.unit}` : ''}
                  </p>
                )}
              </div>
              <ShoppingCart className="w-4 h-4 text-muted-foreground/50 group-hover:text-navy transition-colors" />
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
