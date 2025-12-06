'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { FadeIn, ScaleIn } from './animations';
import { ErrorMessage } from './error-boundary';

interface FormFieldProps {
  label?: string;
  error?: string;
  helpText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FormField({ 
  label, 
  error, 
  helpText, 
  required, 
  children, 
  className,
  delay = 0 
}: FormFieldProps) {
  return (
    <FadeIn direction="up" delay={delay} className={cn('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {children}
      </div>
      {error && (
        <ScaleIn>
          <ErrorMessage error={error} />
        </ScaleIn>
      )}
      {helpText && !error && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {helpText}
        </p>
      )}
    </FadeIn>
  );
}

interface EnhancedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  error?: boolean;
  success?: boolean;
  loading?: boolean;
}

export function EnhancedInput({ 
  icon, 
  error, 
  success, 
  loading,
  className,
  ...props 
}: EnhancedInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const baseClasses = cn(
    'w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
    'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm',
    'placeholder-gray-400 dark:placeholder-gray-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'hover-lift'
  );

  const stateClasses = cn({
    'border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500': !error && !success,
    'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500': error,
    'border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-green-500': success,
  });

  return (
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
          {icon}
        </div>
      )}
      <input
        className={cn(
          baseClasses,
          stateClasses,
          icon && 'pl-10',
          className
        )}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {loading && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="loading-dots">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      )}
    </div>
  );
}

interface EnhancedSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  success?: boolean;
  loading?: boolean;
  placeholder?: string;
}

export function EnhancedSelect({ 
  error, 
  success, 
  loading,
  placeholder,
  className,
  children,
  ...props 
}: EnhancedSelectProps) {
  const baseClasses = cn(
    'w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2',
    'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'hover-lift',
    'appearance-none cursor-pointer'
  );

  const stateClasses = cn({
    'border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500': !error && !success,
    'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500': error,
    'border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-green-500': success,
  });

  return (
    <div className="relative">
      <select
        className={cn(baseClasses, stateClasses, className)}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

interface EnhancedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
  success?: boolean;
  autoResize?: boolean;
}

export function EnhancedTextarea({ 
  error, 
  success, 
  autoResize = true,
  className,
  ...props 
}: EnhancedTextareaProps) {
  const baseClasses = cn(
    'w-full px-4 py-3 rounded-lg border transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none',
    'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm',
    'placeholder-gray-400 dark:placeholder-gray-500',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'hover-lift'
  );

  const stateClasses = cn({
    'border-gray-200 dark:border-gray-600 focus:border-purple-500 focus:ring-purple-500': !error && !success,
    'border-red-300 dark:border-red-600 focus:border-red-500 focus:ring-red-500': error,
    'border-green-300 dark:border-green-600 focus:border-green-500 focus:ring-green-500': success,
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [props.value, autoResize]);

  return (
    <textarea
      ref={textareaRef}
      className={cn(baseClasses, stateClasses, className)}
      {...props}
    />
  );
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function FormActions({ children, className, delay = 0 }: FormActionsProps) {
  return (
    <FadeIn direction="up" delay={delay} className={cn('flex gap-3 pt-6', className)}>
      {children}
    </FadeIn>
  );
}

// Validation utilities
export const validation = {
  email: (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : 'Please enter a valid email address';
  },
  
  required: (value: string | number) => {
    return value?.toString().trim() ? null : 'This field is required';
  },
  
  minLength: (value: string, min: number) => {
    return value.length >= min ? null : `Must be at least ${min} characters`;
  },
  
  maxLength: (value: string, max: number) => {
    return value.length <= max ? null : `Must be no more than ${max} characters`;
  },
  
  numeric: (value: string) => {
    return !isNaN(Number(value)) ? null : 'Must be a valid number';
  },
  
  url: (value: string) => {
    try {
      new URL(value);
      return null;
    } catch {
      return 'Please enter a valid URL';
    }
  },
  
  custom: (value: string, validator: (val: string) => string | null) => {
    return validator(value);
  },
};

// Form validation hook
export function useFormValidation<T extends Record<string, any>>(initialValues: T, validationRules: Record<keyof T, (value: any) => string | null>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<keyof T, string | null>>({} as Record<keyof T, string | null>);
  const [touched, setTouchedState] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);
  const [isValid, setIsValid] = useState(false);

  const validateField = (name: keyof T, value: any) => {
    const rule = validationRules[name];
    return rule ? rule(value) : null;
  };

  const validateAll = () => {
    const newErrors: Record<keyof T, string | null> = {} as Record<keyof T, string | null>;
    let hasErrors = false;

    Object.keys(validationRules).forEach((key) => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, values[fieldName]);
      newErrors[fieldName] = error;
      if (error) hasErrors = true;
    });

    setErrors(newErrors);
    setIsValid(!hasErrors);
    return !hasErrors;
  };

  const setValue = (name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    if (touched[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const markTouched = (name: keyof T) => {
    setTouchedState(prev => ({ ...prev, [name]: true }));
    const error = validateField(name, values[name]);
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({} as Record<keyof T, string | null>);
    setTouchedState({} as Record<keyof T, boolean>);
    setIsValid(false);
  };

  return {
    values,
    errors,
    touched,
    isValid,
    setValue,
    markTouched,
    validateAll,
    reset,
  };
}