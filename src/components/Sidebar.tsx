'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Code, GraduationCap, Wallet, Dumbbell, BarChart3, Settings, CheckSquare, RotateCcw, TrendingUp, Target, Bot, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn, StaggeredContainer } from './ui/animations';
import { ThemeToggle } from './ui/theme-toggle';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Notebook', href: '/notes', icon: FileText, highlight: true },
  { name: 'DSA', href: '/dsa', icon: Code },
  { name: 'College', href: '/college', icon: GraduationCap },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Gym', href: '/gym', icon: Dumbbell },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Health', href: '/health', icon: Dumbbell },
  { name: 'Habit Grid', href: '/habit-grid', icon: Target },
  { name: 'Progress', href: '/progress', icon: BarChart3 },
  { name: 'AI Agent', href: '/ai-agent', icon: Bot },
  { name: 'Reset', href: '/reset', icon: RotateCcw },
];

export function Sidebar({ isOpen, onToggle, onClose }: { isOpen?: boolean; onToggle?: () => void; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay - dimmed backdrop that covers entire screen */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <FadeIn direction="left" delay={100}>
        <div className={cn(
          // Always fixed positioning to float over content on mobile and be sticky on desktop
          'fixed inset-y-0 left-0 z-[60] w-72 flex flex-col',
          'bg-gray-900/95 backdrop-blur-xl border-r border-gray-800/80 shadow-2xl',
          'transform transition-transform duration-300 ease-in-out',
          // Mobile: slide in from left when open, completely off-screen when closed
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible, positioned at left edge
          'lg:translate-x-0'
        )}>
          {/* Header */}
          <div className="flex h-12 items-center justify-end border-b border-gray-700/50 px-4 bg-gray-800/50">
            <FadeIn direction="down" delay={200}>
              <ThemeToggle size="sm" />
            </FadeIn>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 p-4">
            <StaggeredContainer staggerDelay={100}>
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                const isHighlighted = item.highlight;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => onClose?.()} // Close sidebar on mobile when clicking nav items
                    className={cn(
                      'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 relative overflow-hidden',
                      isActive
                        ? 'bg-gradient-to-r from-cyan-600/90 via-blue-600/90 to-purple-600/90 text-white shadow-lg shadow-cyan-500/25 border border-cyan-500/30'
                        : isHighlighted
                        ? 'bg-gradient-to-r from-purple-600/20 to-blue-600/20 text-purple-200 hover:bg-gradient-to-r hover:from-purple-600/40 hover:to-blue-600/40 hover:text-white hover:shadow-lg hover:shadow-purple-500/25 border border-purple-500/30'
                        : 'text-gray-300 hover:bg-gray-700/50 hover:text-white hover:shadow-md'
                    )}
                  >
                    {(isActive || isHighlighted) && (
                      <div className={cn(
                        'absolute inset-0 animate-pulse',
                        isActive 
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20' 
                          : 'bg-gradient-to-r from-purple-500/20 to-blue-500/20'
                      )} />
                    )}
                    <div className={cn(
                      'relative mr-3 h-5 w-5 flex-shrink-0 rounded-md flex items-center justify-center transition-all duration-300',
                      isActive
                        ? 'bg-white/20 shadow-inner'
                        : isHighlighted
                        ? 'bg-purple-500/60 group-hover:bg-purple-400/80 group-hover:shadow-lg group-hover:shadow-purple-500/25'
                        : 'bg-gray-600/60 group-hover:bg-cyan-500/60 group-hover:shadow-lg group-hover:shadow-cyan-500/25'
                    )}>
                      <Icon size={14} className={cn(
                        isActive ? 'text-white' : isHighlighted ? 'text-purple-100 group-hover:text-white' : 'text-gray-300 group-hover:text-white'
                      )} />
                    </div>
                    <span className="relative flex-1 font-medium text-sm flex items-center">
                      {item.name}
                      {isHighlighted && (
                        <span className="ml-2 px-1.5 py-0.5 text-xs bg-purple-500/30 text-purple-200 rounded-full font-semibold">
                          ✨ NEW
                        </span>
                      )}
                    </span>
                    {isActive && (
                      <div className="relative w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-sm shadow-cyan-400/50" />
                    )}
                    {isHighlighted && !isActive && (
                      <div className="relative w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse shadow-sm shadow-purple-400/50" />
                    )}
                  </Link>
                );
              })}
            </StaggeredContainer>
          </nav>

          {/* Footer */}
          <div className="border-t border-gray-700/50 p-4 bg-gray-800/30">
            <FadeIn direction="up" delay={500}>
              <button className="w-full flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-all duration-300 hover:bg-gray-700/50 hover:text-white hover:shadow-md">
                <div className="mr-3 h-5 w-5 bg-gray-600/60 rounded-md flex items-center justify-center transition-all duration-300 hover:bg-cyan-500/60 hover:shadow-lg hover:shadow-cyan-500/25">
                  <Settings size={14} className="text-gray-300" />
                </div>
                <span className="font-medium text-sm">Settings</span>
              </button>
            </FadeIn>
          </div>
        </div>
      </FadeIn>
    </>
  );
}