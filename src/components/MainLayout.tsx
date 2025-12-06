'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { NavigationHeader } from './NavigationHeader';
import { Footer } from './Footer';
import { ThemeToggleFixed } from './ui/theme-toggle';
import { useTheme } from './ui/theme-provider';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/button';

interface MainLayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  showHeader?: boolean;
  onSidebarClose?: () => void;
}

export function MainLayout({ children, showSidebar = true, showHeader = true, onSidebarClose }: MainLayoutProps) {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className={`min-h-screen transition-colors duration-500 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-pink-900/20'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      {/* Desktop Sidebar - only show on lg screens and above */}
      {showSidebar && (
        <div className="hidden lg:block">
          <Sidebar
            isOpen={true}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onClose={() => setSidebarOpen(false)}
          />
        </div>
      )}
      <div className="flex min-h-screen">
        <main className={`flex-1 transition-all duration-300 flex flex-col ${showSidebar ? 'lg:ml-72' : ''} min-h-screen`}>
          {/* Navigation Header */}
          {showHeader && <NavigationHeader />}

          {/* Main content */}
          <div className={`flex-1 ${
            showSidebar ? 'p-2 lg:p-4' : 'p-2'
          }`}>
            <div className={`${
              showSidebar ? 'max-w-full' : 'max-w-full'
            }`}>
              {children}
            </div>
          </div>

          {/* Footer */}
          <Footer />
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