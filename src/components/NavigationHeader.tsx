'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckSquare, BarChart3, Menu, X, Plus, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AddTaskDialog } from './AddTaskDialog';
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
  },
  {
    name: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
];

export function NavigationHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const pathname = usePathname();

  const handleQuickAddTask = () => {
    setTaskDialogOpen(true);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4 lg:px-6">
          {/* Left side - Logo and main navigation */}
          <div className="flex items-center space-x-8">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3">
              <img
                src="/vercel.svg"
                alt="DevLife Logo"
                className="w-8 h-8"
              />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                DevLife
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'group flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 hover-lift',
                      isActive
                        ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-600 dark:text-purple-400 border border-purple-500/30'
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <Icon size={16} className={cn(
                      'transition-colors',
                      isActive ? 'text-purple-600 dark:text-purple-400' : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300'
                    )} />
                    <span>{item.name}</span>
                    {item.badge && (
                      <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Right side - Quick actions and mobile menu */}
          <div className="flex items-center space-x-3">
            {/* Quick Add Task Button */}
            <Button
              onClick={handleQuickAddTask}
              size="sm"
              className="hidden sm:flex bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              <Plus size={16} className="mr-1" />
              <span className="hidden lg:inline">Add Task</span>
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex relative"
            >
              <Bell size={18} />
              {/* Notification badge */}
              <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">2</span>
              </span>
            </Button>

            {/* Authentication Buttons */}
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="outline" size="sm" className="mr-2">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton mode="modal">
                <Button size="sm" className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                  Sign Up
                </Button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </SignedIn>

            {/* Mobile menu button - links to menu page */}
            <Link href="/menu" className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
              >
                <Menu size={18} />
              </Button>
            </Link>
          </div>
        </div>

      </header>

      {/* Quick Add Task Dialog */}
      <AddTaskDialog onRefresh={() => {/* Refresh tasks when dialog closes */}} />
    </>
  );
}