'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { 
  Home, 
  Code, 
  GraduationCap, 
  Wallet, 
  Dumbbell, 
  BarChart3, 
  CheckSquare, 
  RotateCcw, 
  Target, 
  Bot, 
  FileText,
  ArrowLeft,
  Settings,
  Moon,
  Sun,
  Heart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Overview & Analytics' },
  { name: 'Notebook', href: '/notes', icon: FileText, description: 'AI-Powered Notes', highlight: true },
  { name: 'DSA Practice', href: '/dsa', icon: Code, description: 'Algorithm Problems' },
  { name: 'College', href: '/college', icon: GraduationCap, description: 'Academic Tracking' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, description: 'Task Management' },
  { name: 'Gym', href: '/gym', icon: Dumbbell, description: 'Fitness Tracking' },
  { name: 'Wallet', href: '/wallet', icon: Wallet, description: 'Expense Management' },
  { name: 'Health', href: '/health', icon: Heart, description: 'Health Monitoring' },
  { name: 'Habit Grid', href: '/habit-grid', icon: Target, description: 'Habit Formation' },
  { name: 'Progress', href: '/progress', icon: BarChart3, description: 'Progress Analytics' },
  { name: 'AI Agent', href: '/ai-agent', icon: Bot, description: 'AI Assistant' },
  { name: 'Reset', href: '/reset', icon: RotateCcw, description: 'Data Management' },
];

export default function MobileMenuPage() {
  const pathname = usePathname();
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Theme toggle logic would go here
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${isDarkMode ? 'bg-gray-900/95 border-gray-700' : 'bg-white/95 border-gray-200'} backdrop-blur-md border-b`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Back</span>
            </Link>
          </div>
          <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Menu
          </h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className={isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Welcome to DevLife
          </h2>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Your all-in-one developer productivity platform
          </p>
        </div>

        {/* Navigation Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            const isHighlighted = item.highlight;
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'group relative p-4 rounded-xl border transition-all duration-300',
                  isActive
                    ? isDarkMode
                      ? 'bg-gradient-to-br from-cyan-600/20 to-purple-600/20 border-cyan-500/50 shadow-lg shadow-cyan-500/25'
                      : 'bg-gradient-to-br from-cyan-50 to-purple-50 border-cyan-300 shadow-lg'
                    : isHighlighted
                    ? isDarkMode
                      ? 'bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/50 shadow-lg shadow-purple-500/25'
                      : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300 shadow-lg'
                    : isDarkMode
                    ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-700/50 hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                )}
              >
                {/* Highlight Badge for Notebook */}
                {item.highlight && !isActive && (
                  <div className="absolute -top-2 -right-2 px-2 py-1 bg-purple-500 text-white text-xs rounded-full font-semibold">
                    ✨ NEW
                  </div>
                )}
                
                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                )}

                <div className="flex flex-col items-center text-center space-y-3">
                  {/* Icon */}
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-300',
                    isActive
                      ? 'bg-white/20 shadow-inner'
                      : isHighlighted
                      ? 'bg-purple-500/60 group-hover:bg-purple-400/80'
                      : isDarkMode
                      ? 'bg-gray-600/60 group-hover:bg-cyan-500/60'
                      : 'bg-gray-100 group-hover:bg-cyan-100'
                  )}>
                    <Icon 
                      size={20} 
                      className={cn(
                        isActive 
                          ? 'text-white' 
                          : isHighlighted
                          ? 'text-purple-100 group-hover:text-white'
                          : isDarkMode
                          ? 'text-gray-300 group-hover:text-white'
                          : 'text-gray-600 group-hover:text-cyan-600'
                      )} 
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <h3 className={cn(
                      'font-semibold text-sm mb-1',
                      isActive 
                        ? 'text-white' 
                        : isHighlighted
                        ? 'text-purple-200 group-hover:text-white'
                        : isDarkMode
                        ? 'text-white group-hover:text-cyan-300'
                        : 'text-gray-900 group-hover:text-cyan-600'
                    )}>
                      {item.name}
                    </h3>
                    <p className={cn(
                      'text-xs leading-tight',
                      isActive 
                        ? 'text-cyan-200' 
                        : isHighlighted
                        ? 'text-purple-300/80'
                        : isDarkMode
                        ? 'text-gray-400 group-hover:text-gray-300'
                        : 'text-gray-600 group-hover:text-gray-700'
                    )}>
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                {(isHighlighted || isActive) && (
                  <div className={cn(
                    'absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300',
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10'
                      : 'bg-gradient-to-r from-purple-500/10 to-blue-500/10'
                  )} />
                )}
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            Quick Actions
          </h3>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start',
                isDarkMode ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              )}
            >
              <Settings className="w-4 h-4 mr-3" />
              Settings
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            DevLife v2.0 • Powered by AI
          </p>
        </div>
      </main>
    </div>
  );
}