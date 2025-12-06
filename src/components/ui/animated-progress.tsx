'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  className?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  animated?: boolean;
  showLabel?: boolean;
  height?: 'sm' | 'md' | 'lg';
}

export function AnimatedProgress({
  value,
  max = 100,
  className,
  color = 'primary',
  animated = true,
  showLabel = false,
  height = 'md'
}: AnimatedProgressProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    setIsVisible(true);
    if (animated) {
      const timer = setTimeout(() => {
        setAnimatedValue(percentage);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setAnimatedValue(percentage);
    }
  }, [percentage, animated]);

  const heightClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };

  const colorClasses = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-600',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600'
  };

  return (
    <div className={cn('w-full space-y-1', className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>Progress</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn(
        'relative overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700',
        heightClasses[height]
      )}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-out',
            colorClasses[color],
            animated && 'animate-pulse'
          )}
          style={{
            width: `${isVisible ? animatedValue : 0}%`
          }}
        />
        {animated && animatedValue > 0 && (
          <div
            className="absolute inset-0 h-full w-full rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"
            style={{
              transform: 'translateX(-100%)',
              animation: 'shimmer 2s infinite'
            }}
          />
        )}
      </div>
    </div>
  );
}