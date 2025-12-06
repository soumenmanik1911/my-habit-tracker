'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';
import { Button } from './button';
import { FadeIn } from './animations';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function ThemeToggle({ 
  className, 
  size = 'md',
  variant = 'ghost' 
}: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };

  return (
    <FadeIn direction="right" delay={200}>
      <Button
        variant={variant}
        size="sm"
        onClick={toggleTheme}
        className={cn(
          'relative overflow-hidden transition-all duration-300 hover:scale-105',
          sizeClasses[size],
          className
        )}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        <div className="relative w-full h-full flex items-center justify-center">
          <Sun 
            className={cn(
              'absolute transition-all duration-500',
              theme === 'light' 
                ? 'rotate-0 scale-100 opacity-100' 
                : 'rotate-90 scale-0 opacity-0'
            )}
            size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
          />
          <Moon 
            className={cn(
              'absolute transition-all duration-500',
              theme === 'dark' 
                ? 'rotate-0 scale-100 opacity-100' 
                : '-rotate-90 scale-0 opacity-0'
            )}
            size={size === 'sm' ? 14 : size === 'lg' ? 20 : 16}
          />
        </div>
        
        {/* Ripple effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-400/20 to-pink-400/20 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-md" />
      </Button>
    </FadeIn>
  );
}

// Fixed theme toggle for header
export function ThemeToggleFixed() {
  return (
    <div className="fixed top-4 left-4 z-50">
      <ThemeToggle />
    </div>
  );
}