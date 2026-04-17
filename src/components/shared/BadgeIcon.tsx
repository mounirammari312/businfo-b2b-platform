'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { useLocaleStore } from '@/lib/store';
import {
  CheckCircle2,
  Star,
  TrendingUp,
  Truck,
  ShieldCheck,
  Award,
  type LucideIcon,
} from 'lucide-react';

type BadgeSlug =
  | 'verified'
  | 'premium'
  | 'top_seller'
  | 'free_shipping'
  | 'quality_guarantee';

interface BadgeTypeConfig {
  label: { ar: string; fr: string };
  bgClass: string;
  icon: LucideIcon;
  iconColor: string;
}

const BADGE_CONFIG: Record<BadgeSlug, BadgeTypeConfig> = {
  verified: {
    label: { ar: 'مورد معتمد', fr: 'Certifie' },
    bgClass: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle2,
    iconColor: 'text-green-600',
  },
  premium: {
    label: { ar: 'مميز ذهبي', fr: 'Premium' },
    bgClass: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Star,
    iconColor: 'text-amber-500',
  },
  top_seller: {
    label: { ar: 'الأكثر مبيعا', fr: 'Top Vendeur' },
    bgClass: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: TrendingUp,
    iconColor: 'text-blue-600',
  },
  free_shipping: {
    label: { ar: 'شحن مجاني', fr: 'Livraison Gratuite' },
    bgClass: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: Truck,
    iconColor: 'text-purple-600',
  },
  quality_guarantee: {
    label: { ar: 'ضمان الجودة', fr: 'Garantie Qualite' },
    bgClass: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: ShieldCheck,
    iconColor: 'text-slate-600',
  },
};

interface BadgeIconProps {
  slug: BadgeSlug | string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BadgeIcon({ slug, size = 'sm', className }: BadgeIconProps) {
  const { locale } = useLocaleStore();
  const config = BADGE_CONFIG[slug as BadgeSlug];

  if (!config) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium bg-muted text-muted-foreground',
          className
        )}
      >
        <Award className="w-3 h-3" />
        {slug}
      </span>
    );
  }

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px] gap-0.5',
    md: 'px-2 py-1 text-xs gap-1',
    lg: 'px-3 py-1.5 text-sm gap-1.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        config.bgClass,
        sizeClasses[size],
        className
      )}
    >
      <Icon className={cn(iconSizes[size], config.iconColor)} />
      <span>{locale === 'ar' ? config.label.ar : config.label.fr}</span>
    </span>
  );
}
