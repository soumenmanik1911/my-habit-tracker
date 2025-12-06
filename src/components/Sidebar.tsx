'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Code, GraduationCap, Wallet, Dumbbell, BarChart3, Settings, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FadeIn, StaggeredContainer } from './ui/animations';
import { ThemeToggle } from './ui/theme-toggle';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'DSA', href: '/dsa', icon: Code },
  { name: 'College', href: '/college', icon: GraduationCap },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare },
  { name: 'Gym', href: '/gym', icon: Dumbbell },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Health', href: '/health', icon: Dumbbell },
  { name: 'Progress', href: '/progress', icon: BarChart3 },
];

export function Sidebar({ isOpen, onToggle }: { isOpen?: boolean; onToggle?: () => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <FadeIn direction="left" delay={100}>
        <div className={`
          fixed inset-y-0 left-0 z-50
          flex h-full w-72 flex-col glass-dark border-r border-gray-700/50 backdrop-blur-xl
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-700/50 px-6">
          <FadeIn direction="left" delay={200}>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DL</span>
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                DevLife
              </h1>
            </div>
          </FadeIn>
          <FadeIn direction="down" delay={300}>
            <ThemeToggle size="sm" />
          </FadeIn>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 space-y-2 p-4">
          <StaggeredContainer staggerDelay={100}>
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 hover-lift',
                    isActive
                      ? 'bg-gradient-to-r from-purple-600/80 to-pink-600/80 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                  )}
                >
                  <div className={cn(
                    'mr-3 h-6 w-6 flex-shrink-0 rounded-lg flex items-center justify-center transition-all duration-300',
                    isActive 
                      ? 'bg-white/20' 
                      : 'bg-gray-600/50 group-hover:bg-purple-500/50'
                  )}>
                    <Icon size={16} className={isActive ? 'text-white' : 'text-gray-300'} />
                  </div>
                  <span className="flex-1">{item.name}</span>
                  {isActive && (
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </StaggeredContainer>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700/50 p-4">
          <FadeIn direction="up" delay={500}>
            <button className="w-full flex items-center rounded-xl px-4 py-3 text-sm font-medium text-gray-300 transition-all duration-300 hover:bg-white/5 hover:text-white hover-lift">
              <div className="mr-3 h-6 w-6 bg-gray-600/50 rounded-lg flex items-center justify-center transition-all duration-300 hover:bg-purple-500/50">
                <Settings size={16} className="text-gray-300" />
              </div>
              Settings
            </button>
          </FadeIn>
        </div>
      </div>
    </FadeIn>
    </>
  );
}