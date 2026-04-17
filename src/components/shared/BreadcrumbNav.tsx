'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocaleStore } from '@/lib/store';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function BreadcrumbNav({ items, className }: BreadcrumbNavProps) {
  const { locale } = useLocaleStore();
  const SeparatorIcon = locale === 'ar' ? ChevronLeft : ChevronRight;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm flex-wrap', className)}
    >
      <Link
        href="/"
        className="flex items-center gap-1 text-[var(--text-secondary)] hover:text-navy transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {locale === 'ar' ? 'الرئيسية' : 'Accueil'}
        </span>
      </Link>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <SeparatorIcon className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
            {isLast || !item.href ? (
              <span
                className={cn(
                  'font-medium truncate',
                  isLast ? 'text-foreground' : 'text-[var(--text-secondary)]'
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-[var(--text-secondary)] hover:text-navy transition-colors truncate max-w-48"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
