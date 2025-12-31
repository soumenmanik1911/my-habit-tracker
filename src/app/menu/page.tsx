'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Home, Code, GraduationCap, Wallet, Dumbbell, BarChart3, Settings, CheckSquare, RotateCcw, ArrowLeft, Bot } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FadeIn, StaggeredContainer } from '@/components/ui/animations';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home, description: 'Overview & Stats' },
  { name: 'DSA', href: '/dsa', icon: Code, description: 'Problem Solving' },
  { name: 'College', href: '/college', icon: GraduationCap, description: 'Attendance & Grades' },
  { name: 'Tasks', href: '/tasks', icon: CheckSquare, description: 'Todo Management' },
  { name: 'Gym', href: '/gym', icon: Dumbbell, description: 'Workout Tracking' },
  { name: 'Wallet', href: '/wallet', icon: Wallet, description: 'Expense Management' },
  { name: 'Health', href: '/health', icon: Dumbbell, description: 'Daily Health Log' },
  { name: 'AI Agent', href: '/ai-agent', icon: Bot, description: 'Smart Productivity Companion' },
  { name: 'Progress', href: '/progress', icon: BarChart3, description: 'Analytics & Insights' },
  { name: 'Reset', href: '/reset', icon: RotateCcw, description: 'Data Management' },
];

export default function MenuPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-40 w-full border-b border-gray-700 bg-gray-900/95 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between px-4">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold">Menu</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="max-w-md mx-auto">
          <FadeIn>
            <h2 className="text-2xl font-bold text-center mb-8 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              DevLife Suite
            </h2>
          </FadeIn>

          <StaggeredContainer staggerDelay={50}>
            <div className="grid grid-cols-1 gap-4">
              {navigation.map((item, index) => {
                const Icon = item.icon;
                return (
                  <FadeIn key={item.name} delay={index * 50}>
                    <Link href={item.href}>
                      <Card className="bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-700/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-cyan-500/20">
                        <CardContent className="p-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/25">
                              <Icon size={24} className="text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-white">{item.name}</h3>
                              <p className="text-sm text-gray-400">{item.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </FadeIn>
                );
              })}
            </div>
          </StaggeredContainer>

          {/* Settings Card */}
          <FadeIn delay={500}>
            <div className="mt-8 pt-6 border-t border-gray-700">
              <Card className="bg-gray-800/50 border border-gray-700 rounded-xl hover:bg-gray-700/50 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Settings size={24} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">Settings</h3>
                      <p className="text-sm text-gray-400">App preferences & configuration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}