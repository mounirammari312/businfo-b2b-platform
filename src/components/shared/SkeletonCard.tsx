'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductSkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-border overflow-hidden',
        className
      )}
    >
      <Skeleton className="w-full h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-6 w-24 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

export function SupplierSkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-border overflow-hidden',
        className
      )}
    >
      <Skeleton className="w-full h-28 rounded-none" />
      <div className="p-5 space-y-3 -mt-8 relative z-10">
        <div className="flex items-end gap-3">
          <Skeleton className="w-12 h-12 rounded-xl border-2 border-white" />
          <div className="flex-1 space-y-2 pt-4">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Skeleton className="h-5 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3 space-y-3">
          <Skeleton className="w-full aspect-[4/3] rounded-xl" />
          <div className="flex gap-2">
            <Skeleton className="w-20 h-20 rounded-lg" />
            <Skeleton className="w-20 h-20 rounded-lg" />
            <Skeleton className="w-20 h-20 rounded-lg" />
            <Skeleton className="w-20 h-20 rounded-lg" />
          </div>
        </div>
        <div className="lg:col-span-2 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function SupplierDetailSkeleton() {
  return (
    <div>
      <Skeleton className="w-full h-56" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="bg-white rounded-xl border p-6 space-y-4">
          <div className="flex items-start gap-4">
            <Skeleton className="w-20 h-20 rounded-xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
        <div className="mt-8 grid grid-cols-3 gap-4">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
