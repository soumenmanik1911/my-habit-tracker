'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { NavigationHeader } from './NavigationHeader';
import { ThemeToggleFixed } from './ui/theme-toggle';
import { useTheme } from './ui/theme-provider';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showHeader?: boolean;
}

export function MainLayout({ children, showSidebar = true, showHeader = true }: MainLayoutProps) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      <div className="flex">
        {showSidebar && (
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />
        )}

        <main className="flex-1 transition-all duration-300">
          {/* Navigation Header */}
          {showHeader && <NavigationHeader />}

          {/* Mobile menu button and theme toggle - only show if no header */}
          {!showHeader && showSidebar && (
            <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <ThemeToggleFixed />
            </div>
          )}

          {/* Main content */}
          <div className={`min-h-screen ${
            showSidebar ? 'p-4 lg:p-6' : 'p-4'
          }`}>
            <div className={`${
              showSidebar ? 'max-w-7xl mx-auto' : 'max-w-full'
            }`}>
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// Compact layout for pages without sidebar
export function CompactLayout({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      <div className="min-h-screen p-4">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}