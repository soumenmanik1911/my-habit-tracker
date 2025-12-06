'use client';

import React, { useState, useEffect, useContext, createContext } from 'react';
import { cn } from '@/lib/utils';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose: (id: string) => void;
}

export function Toast({ id, type, title, message, duration = 5000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsLeaving(true);
      setTimeout(() => onClose(id), 300); // Wait for animation to complete
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const typeConfig = {
    success: {
      bg: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
      text: 'text-green-800 dark:text-green-200',
      icon: '✓'
    },
    error: {
      bg: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800',
      text: 'text-red-800 dark:text-red-200',
      icon: '✕'
    },
    warning: {
      bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800',
      text: 'text-yellow-800 dark:text-yellow-200',
      icon: '⚠'
    },
    info: {
      bg: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800',
      text: 'text-blue-800 dark:text-blue-200',
      icon: 'ℹ'
    }
  };

  const config = typeConfig[type];

  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 max-w-sm rounded-lg border p-4 shadow-lg transition-all duration-300',
        config.bg,
        isVisible ? 'transform translate-x-0 opacity-100' : 'transform translate-x-full opacity-0',
        isLeaving && 'transform translate-x-full opacity-0'
      )}
    >
      <div className="flex items-start space-x-3">
        <div className={cn(
          'flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold',
          config.text
        )}>
          {config.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-medium', config.text)}>
            {title}
          </p>
          {message && (
            <p className={cn('text-xs mt-1', config.text)}>
              {message}
            </p>
          )}
        </div>
        <button
          onClick={() => {
            setIsLeaving(true);
            setTimeout(() => onClose(id), 300);
          }}
          className={cn(
            'flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors',
            config.text
          )}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

interface ToastContextType {
  toasts: Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message?: string;
  }>;
  addToast: (toast: Omit<ToastContextType['toasts'][0], 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastContextType['toasts']>([]);

  const addToast = (toast: Omit<ToastContextType['toasts'][0], 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            onClose={removeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}