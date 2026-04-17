'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { LucideIcon, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocaleStore } from '@/lib/store';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  const { locale } = useLocaleStore();
  const ArrowIcon = locale === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-5">
        <Icon className="w-8 h-8 text-muted-foreground/50" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actionLabel && (actionHref || onAction) && (
        actionHref ? (
          <Button
            asChild
            className="bg-navy hover:bg-navy-light text-white rounded-xl px-6"
          >
            <Link href={actionHref} className="flex items-center gap-1.5">
              {actionLabel}
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </Button>
        ) : (
          <Button
            onClick={onAction}
            className="bg-navy hover:bg-navy-light text-white rounded-xl px-6"
          >
            {actionLabel}
          </Button>
        )
      )}
    </div>
  );
}
