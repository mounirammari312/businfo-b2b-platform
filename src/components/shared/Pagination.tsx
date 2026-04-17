'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocaleStore } from '@/lib/store';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const { locale } = useLocaleStore();
  const PrevIcon = locale === 'ar' ? ChevronRight : ChevronLeft;
  const NextIcon = locale === 'ar' ? ChevronLeft : ChevronRight;

  if (totalPages <= 1) return null;

  const getPages = () => {
    const pages: (number | '...')[] = [];
    const delta = 2;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      const start = Math.max(2, currentPage - delta);
      const end = Math.min(totalPages - 1, currentPage + delta);

      if (start > 2) pages.push('...');

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages - 1) pages.push('...');

      pages.push(totalPages);
    }

    return pages;
  };

  const pages = getPages();

  return (
    <div
      className={cn(
        'flex items-center justify-center gap-1',
        className
      )}
    >
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-lg"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <PrevIcon className="w-4 h-4" />
      </Button>

      {pages.map((page, index) =>
        page === '...' ? (
          <span
            key={`dots-${index}`}
            className="px-2 text-sm text-muted-foreground"
          >
            ...
          </span>
        ) : (
          <Button
            key={page}
            variant={currentPage === page ? 'default' : 'outline'}
            size="icon"
            className={cn(
              'h-9 w-9 rounded-lg text-sm font-medium',
              currentPage === page && 'bg-navy hover:bg-navy-light text-white'
            )}
            onClick={() => onPageChange(page)}
          >
            {page}
          </Button>
        )
      )}

      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-lg"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <NextIcon className="w-4 h-4" />
      </Button>
    </div>
  );
}
