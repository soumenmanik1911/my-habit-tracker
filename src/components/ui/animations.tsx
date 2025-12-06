'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 500, 
  className,
  direction = 'up'
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const directionClasses = {
    up: 'translate-y-4',
    down: '-translate-y-4',
    left: '-translate-x-4',
    right: 'translate-x-4',
    none: ''
  };

  return (
    <div
      className={cn(
        'transition-all ease-out',
        duration && `duration-[${duration}ms]`,
        isVisible 
          ? 'opacity-100 translate-x-0 translate-y-0' 
          : `opacity-0 ${directionClasses[direction]}`,
        className
      )}
    >
      {children}
    </div>
  );
}

interface SlideInProps {
  children: ReactNode;
  direction: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  distance?: number;
  className?: string;
}

export function SlideIn({ 
  children, 
  direction, 
  delay = 0, 
  distance = 50,
  className
}: SlideInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const directionClasses = {
    left: 'translate-x-[-100%]',
    right: 'translate-x-[100%]',
    up: 'translate-y-[-100%]',
    down: 'translate-y-[100%]'
  };

  return (
    <div
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible 
          ? 'opacity-100 translate-x-0 translate-y-0' 
          : `opacity-0 ${directionClasses[direction]}`,
        className
      )}
      style={{
        transform: !isVisible 
          ? `translate${direction === 'left' || direction === 'right' ? 'X' : 'Y'}(${directionClasses[direction].match(/\[-?\d+%\]/) ? distance : -distance}px)`
          : undefined
      }}
    >
      {children}
    </div>
  );
}

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  scale?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, scale = 0.8, className }: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-out',
        isVisible 
          ? 'opacity-100 scale-100' 
          : `opacity-0 scale-[${scale}]`,
        className
      )}
    >
      {children}
    </div>
  );
}

interface StaggeredContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function StaggeredContainer({ children, staggerDelay = 100, className }: StaggeredContainerProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn delay={index * staggerDelay} key={index}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

interface BounceInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function BounceIn({ children, delay = 0, className }: BounceInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={cn(
        'transition-all duration-700 ease-out',
        isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-50',
        'animate-bounce-in',
        className
      )}
    >
      {children}
    </div>
  );
}