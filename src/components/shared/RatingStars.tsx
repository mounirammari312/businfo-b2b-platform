'use client';

import React from 'react';
import { Star, StarHalf } from 'lucide-react';
import { cn, formatRating, getRatingColor } from '@/lib/utils';

interface RatingStarsProps {
  rating: number;
  reviewCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RatingStars({
  rating,
  reviewCount,
  showCount = true,
  size = 'sm',
  className,
}: RatingStarsProps) {
  const sizeClasses = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4.5 h-4.5',
    lg: 'w-5.5 h-5.5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      <div className="flex items-center">
        {Array.from({ length: fullStars }).map((_, i) => (
          <Star
            key={`full-${i}`}
            className={cn(sizeClasses[size], 'fill-gold text-gold')}
          />
        ))}
        {hasHalf && (
          <div className="relative">
            <Star className={cn(sizeClasses[size], 'text-muted-foreground/30')} />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className={cn(sizeClasses[size], 'fill-gold text-gold')} />
            </div>
          </div>
        )}
        {Array.from({ length: emptyStars }).map((_, i) => (
          <Star
            key={`empty-${i}`}
            className={cn(sizeClasses[size], 'text-muted-foreground/30')}
          />
        ))}
      </div>
      <span
        className={cn(
          'font-semibold ms-1',
          getRatingColor(rating),
          textSizes[size]
        )}
      >
        {formatRating(rating)}
      </span>
      {showCount && reviewCount !== undefined && (
        <span className="text-[var(--text-secondary)] text-xs ms-0.5">
          ({reviewCount})
        </span>
      )}
    </div>
  );
}
