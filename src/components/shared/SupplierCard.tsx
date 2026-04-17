'use client';

import React from 'react';
import Link from 'next/link';
import { cn, truncateText } from '@/lib/utils';
import { useLocaleStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RatingStars } from './RatingStars';
import { BadgeIcon } from './BadgeIcon';
import { CheckCircle2, Package, Eye, MapPin } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export interface SupplierCardData {
  id: string;
  name: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  logoUrl?: string;
  coverUrl?: string;
  category?: string;
  city?: string;
  rating?: number;
  reviewCount?: number;
  productCount?: number;
  views?: number;
  isVerified?: boolean;
  badges?: string[];
}

interface SupplierCardProps {
  supplier: SupplierCardData;
  className?: string;
}

export function SupplierCard({ supplier, className }: SupplierCardProps) {
  const { locale } = useLocaleStore();

  const displayName =
    locale === 'fr' && supplier.nameEn ? supplier.nameEn : supplier.name;

  const displayDesc =
    locale === 'fr' && supplier.descriptionEn
      ? supplier.descriptionEn
      : supplier.description || '';

  return (
    <Link href={`/supplier/${supplier.id}`} className="group block">
      <Card
        className={cn(
          'overflow-hidden border border-border hover:border-navy/20 hover:shadow-[var(--shadow-lg)] transition-all duration-300 group-hover:scale-[1.01] h-full flex flex-col',
          className
        )}
      >
        {/* Cover */}
        <div className="relative h-28 bg-gradient-to-s from-navy/5 to-navy/10 overflow-hidden">
          {supplier.coverUrl ? (
            <img
              src={supplier.coverUrl}
              alt={displayName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-full h-full bg-gradient-to-br from-navy/5 to-gold/5" />
            </div>
          )}
          {/* Verified badge */}
          {supplier.isVerified && (
            <div className="absolute top-2.5 end-2.5">
              <Badge className="bg-green-600 text-white text-[10px] px-2 py-0.5 border-0 gap-1 font-medium shadow-sm">
                <CheckCircle2 className="w-3 h-3" />
                {locale === 'ar' ? 'معتمد' : 'Certifie'}
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex items-start gap-3 mb-3 -mt-8 relative z-10">
            {/* Logo */}
            <div className="w-14 h-14 rounded-xl border-2 border-white bg-white shadow-[var(--shadow-md)] overflow-hidden shrink-0 flex items-center justify-center">
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
            <div className="flex-1 min-w-0 pt-2">
              <h3 className="font-semibold text-foreground text-sm truncate group-hover:text-navy transition-colors leading-snug">
                {displayName}
              </h3>
              {supplier.category && (
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  {supplier.category}
                </p>
              )}
            </div>
          </div>

          {/* Description */}
          {displayDesc && (
            <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mb-3 leading-relaxed">
              {truncateText(displayDesc, 80)}
            </p>
          )}

          {/* Badges */}
          {supplier.badges && supplier.badges.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {supplier.badges.map((badge, i) => (
                <BadgeIcon key={i} slug={badge} size="sm" />
              ))}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Footer Stats */}
          <div className="pt-3 border-t border-border/50 flex items-center justify-between">
            <RatingStars
              rating={supplier.rating || 0}
              reviewCount={supplier.reviewCount}
              size="sm"
            />
            <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
              <span className="flex items-center gap-1 text-xs">
                <Package className="w-3 h-3" />
                {formatNumber(supplier.productCount || 0, locale)}
              </span>
              {supplier.city && (
                <span className="flex items-center gap-1 text-xs">
                  <MapPin className="w-3 h-3" />
                  <span className="max-w-16 truncate">{supplier.city}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
