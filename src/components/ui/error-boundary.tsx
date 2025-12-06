'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { FadeIn, ScaleIn } from './animations';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <FadeIn direction="up">
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 border-0 shadow-xl">
              <CardHeader className="text-center pb-4">
                <ScaleIn delay={100}>
                  <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                </ScaleIn>
                <CardTitle className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  Oops! Something went wrong
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <FadeIn delay={200}>
                  <p className="text-gray-600 dark:text-gray-300">
                    We encountered an unexpected error. Don't worry, our team has been notified.
                  </p>
                </FadeIn>
                
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg text-left text-xs font-mono text-red-600 dark:text-red-400 overflow-auto">
                    {this.state.error.message}
                  </div>
                )}

                <div className="flex gap-3 justify-center pt-4">
                  <FadeIn delay={300}>
                    <Button
                      onClick={this.handleRetry}
                      variant="default"
                      className="flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try Again
                    </Button>
                  </FadeIn>
                  <FadeIn delay={400}>
                    <Button
                      onClick={this.handleGoHome}
                      variant="outline"
                      className="flex items-center gap-2 hover:scale-105 transition-transform"
                    >
                      <Home className="w-4 h-4" />
                      Go Home
                    </Button>
                  </FadeIn>
                </div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      );
    }

    return this.props.children;
  }
}

// Lightweight error component for smaller contexts
export function ErrorMessage({ 
  error, 
  retry, 
  className 
}: { 
  error: string; 
  retry?: () => void;
  className?: string;
}) {
  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
        <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        {retry && (
          <Button
            onClick={retry}
            variant="ghost"
            size="sm"
            className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-100 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/30"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}