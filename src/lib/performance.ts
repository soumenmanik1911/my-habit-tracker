// Performance monitoring and optimization utilities

interface PerformanceMetrics {
  renderTime: number;
  componentCount: number;
  memoryUsage?: number;
  fps?: number;
}

interface PerformanceOptions {
  logSlowRenders?: boolean;
  threshold?: number;
  enableMemoryTracking?: boolean;
  enableFPS?: boolean;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private options: PerformanceOptions;

  constructor(options: PerformanceOptions = {}) {
    this.options = {
      logSlowRenders: true,
      threshold: 16, // 16ms = 60fps
      enableMemoryTracking: false,
      enableFPS: true,
      ...options
    };
  }

  static getInstance(options?: PerformanceOptions): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor(options);
    }
    return PerformanceMonitor.instance;
  }

  startMeasure(componentName: string): () => void {
    const startTime = performance.now();
    const startMemory = this.options.enableMemoryTracking ? this.getMemoryUsage() : 0;

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      const memoryUsed = this.options.enableMemoryTracking ? this.getMemoryUsage() - startMemory : 0;

      const metrics: PerformanceMetrics = {
        renderTime,
        componentCount: 1,
        memoryUsage: memoryUsed > 0 ? memoryUsed : undefined
      };

      this.metrics.set(componentName, metrics);

      if (this.options.logSlowRenders && renderTime > this.options.threshold!) {
        console.warn(`[Performance] ${componentName} took ${renderTime.toFixed(2)}ms to render`);
        if (memoryUsed > 0) {
          console.warn(`[Performance] Memory used: ${(memoryUsed / 1024 / 1024).toFixed(2)}MB`);
        }
      }
    };
  }

  getMetrics(componentName?: string): PerformanceMetrics | Map<string, PerformanceMetrics> {
    if (componentName) {
      return this.metrics.get(componentName) || {
        renderTime: 0,
        componentCount: 0
      };
    }
    return new Map(this.metrics);
  }

  clearMetrics(): void {
    this.metrics.clear();
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize;
    }
    return 0;
  }

  getFPS(): number {
    let lastTime = performance.now();
    let frames = 0;
    
    const measure = () => {
      const currentTime = performance.now();
      frames++;
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
        return fps;
      }
      return 0;
    };
    
    // Call once to initialize
    measure();
    
    // Return the measurement function
    return measure() || 60; // Default to 60fps if measurement fails
  }
}

// Bundle size analyzer
export function analyzeBundleSize() {
  if (typeof window === 'undefined') return null;

  const scriptElements = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
  const stylesheetElements = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];

  const resources = [
    ...scriptElements.map(el => ({ type: 'script', url: el.src })),
    ...stylesheetElements.map(el => ({ type: 'stylesheet', url: el.href }))
  ];

  return {
    resourceCount: resources.length,
    resources,
    analysis: resources.map(resource => ({
      ...resource,
      size: 'Unknown', // Would need to be measured server-side
      cached: 'Unknown' // Would need service worker integration
    }))
  };
}

// Memory leak detection
export function detectMemoryLeaks() {
  if (typeof window === 'undefined' || 'memory' !in performance) {
    console.warn('Memory leak detection not available in this environment');
    return () => {};
  }

  const memoryInfo = (performance as any).memory;
  const initialMemory = memoryInfo.usedJSHeapSize;
  
  const checkMemory = () => {
    const currentMemory = memoryInfo.usedJSHeapSize;
    const memoryIncrease = currentMemory - initialMemory;
    const memoryIncreaseMB = memoryIncrease / 1024 / 1024;
    
    if (memoryIncreaseMB > 10) { // Warn if memory increased by more than 10MB
      console.warn(`[Memory] Potential memory leak detected: ${memoryIncreaseMB.toFixed(2)}MB increase`);
    }
    
    return memoryIncreaseMB;
  };

  const interval = setInterval(checkMemory, 5000); // Check every 5 seconds

  return () => clearInterval(interval);
}

// Animation performance optimization
export function optimizeAnimations() {
  if (typeof window === 'undefined') return;

  // Enable hardware acceleration for better animation performance
  const style = document.createElement('style');
  style.textContent = `
    .gpu-accelerated {
      transform: translateZ(0);
      will-change: transform;
    }
    
    .animate-optimized {
      transform: translate3d(0, 0, 0);
      backface-visibility: hidden;
      perspective: 1000px;
    }
    
    .reduce-motion *,
    .reduce-motion *::before,
    .reduce-motion *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  `;
  document.head.appendChild(style);

  // Reduce motion for users who prefer it
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (prefersReducedMotion.matches) {
    document.documentElement.classList.add('reduce-motion');
  }
}

// Code splitting utilities
export function createCodeSplitComponent<T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    loadingComponent?: React.ComponentType;
    errorComponent?: React.ComponentType<{ error: Error }>;
    timeout?: number;
  }
) {
  const { loadingComponent: Loading, errorComponent: ErrorFallback, timeout = 30000 } = options || {};
  
  return React.lazy(async () => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Component loading timeout')), timeout);
    });
    
    try {
      const result = await Promise.race([importFunc(), timeoutPromise]);
      return result;
    } catch (error) {
      console.error('Component loading failed:', error);
      throw error;
    }
  });
}

// React imports
import React from 'react';