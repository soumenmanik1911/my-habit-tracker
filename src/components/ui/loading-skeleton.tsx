'use client';

import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  className?: string;
  rows?: number;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string;
  height?: string;
}

export function LoadingSkeleton({
  className,
  rows = 1,
  variant = 'rectangular',
  width,
  height
}: LoadingSkeletonProps) {
  const baseClasses = 'animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]';

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded'
  };

  const skeletonClass = cn(
    baseClasses,
    variantClasses[variant],
    className
  );

  if (variant === 'text' && rows > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className={cn(
              skeletonClass,
              width ? 'w-full' : 'w-full',
              height ? height : 'h-4',
              i === rows - 1 && 'w-3/4' // Last row shorter
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={skeletonClass}
      style={{
        width: width || undefined,
        height: height || undefined
      }}
    />
  );
}

// Pre-built skeleton components for common use cases
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 space-y-4', className)}>
      <LoadingSkeleton variant="text" rows={2} className="h-6 w-1/2" />
      <LoadingSkeleton variant="text" rows={3} className="h-4" />
      <LoadingSkeleton className="h-8 w-20" />
    </div>
  );
}

export function StatsCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 space-y-3', className)}>
      <LoadingSkeleton className="h-8 w-20" />
      <LoadingSkeleton variant="text" className="h-4 w-24" />
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('p-6 space-y-4', className)}>
      <LoadingSkeleton variant="text" rows={1} className="h-6 w-1/3" />
      <LoadingSkeleton className="h-64 w-full" />
    </div>
  );
}