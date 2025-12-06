'use client';

import { useState, useEffect, useTransition } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { AnimatedCounter } from '@/components/ui/animated-counter';
import { AnimatedProgress } from '@/components/ui/animated-progress';
import { LoadingSkeleton, CardSkeleton, StatsCardSkeleton } from '@/components/ui/loading-skeleton';
import { FadeIn, StaggeredContainer, ScaleIn } from '@/components/ui/animations';
import { AnimatedLineChart, AnimatedBarChart, AnimatedDoughnutChart, BaseChart } from '@/components/ui/charts';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/components/ui/theme-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  BarChart3, 
  Zap,
  Heart,
  Brain,
  GraduationCap,
  Code,
  Wallet,
  Dumbbell
} from 'lucide-react';

// Sample data for charts
const generateChartData = () => {
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const data = [12, 19, 3, 5, 2, 3, 14];
  
  return {
    labels,
    datasets: [
      {
        label: 'Daily Progress',
        data,
        borderColor: 'rgb(147, 51, 234)',
        backgroundColor: 'rgba(147, 51, 234, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };
};

const generateExpenseData = () => {
  return {
    labels: ['Food', 'Travel', 'Study', 'Entertainment', 'Other'],
    datasets: [
      {
        data: [35, 20, 25, 15, 5],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
        ],
        borderWidth: 0,
      },
    ],
  };
};

const generatePerformanceData = () => {
  return {
    labels: ['DSA', 'College', 'Health', 'Finance'],
    datasets: [
      {
        label: 'Performance',
        data: [85, 92, 78, 67],
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
      },
    ],
  };
};

export default function ModernDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const { theme } = useTheme();
  const { addToast } = useToast();

  // Simulate data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setData({
        dsaProblemsToday: 3,
        gymStreak: 12,
        totalExpensesThisMonth: 2540,
        totalDebts: 500,
        lowestAttendance: { subject: 'Mathematics', percentage: 82 },
        subjects: [
          { id: 1, name: 'Mathematics', attendance: 85, progress: 75 },
          { id: 2, name: 'Physics', attendance: 92, progress: 88 },
          { id: 3, name: 'Chemistry', attendance: 78, progress: 65 },
          { id: 4, name: 'Computer Science', attendance: 95, progress: 92 },
        ]
      });
      setLoading(false);
      addToast({
        type: 'success',
        title: 'Dashboard Updated',
        message: 'All data loaded successfully!'
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [addToast]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <StatsCardSkeleton key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <FadeIn direction="up">
          <div className="text-center space-y-4 py-8 lg:py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-3xl blur-3xl" />
            <div className="relative">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent mb-4">
                DevLife Dashboard
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-6 px-4">
                {getGreeting()}! Ready to level up? 🚀
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 sm:space-x-4">
                <ScaleIn delay={200}>
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                    <Zap className="w-5 h-5 mr-2" />
                    Quick Actions
                  </Button>
                </ScaleIn>
                <ScaleIn delay={300}>
                  <Button variant="outline" className="px-6 py-3 rounded-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto">
                    <BarChart3 className="w-5 h-5 mr-2" />
                    Analytics
                  </Button>
                </ScaleIn>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Stats Overview */}
        <StaggeredContainer staggerDelay={100}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {/* DSA Stats */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">DSA Today</p>
                    <AnimatedCounter 
                      value={data?.dsaProblemsToday || 0} 
                      className="text-3xl font-bold text-purple-600 dark:text-purple-400"
                    />
                  </div>
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                    <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gym Streak */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Gym Streak</p>
                    <AnimatedCounter 
                      value={data?.gymStreak || 0} 
                      suffix=" days"
                      className="text-3xl font-bold text-green-600 dark:text-green-400"
                    />
                  </div>
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <Dumbbell className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Expenses */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                    <AnimatedCounter 
                      value={data?.totalExpensesThisMonth || 0} 
                      prefix="₹"
                      className="text-3xl font-bold text-orange-600 dark:text-orange-400"
                    />
                  </div>
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Attendance */}
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl hover-lift">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Attendance</p>
                    <AnimatedCounter 
                      value={data?.lowestAttendance?.percentage || 0} 
                      suffix="%"
                      className="text-3xl font-bold text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </StaggeredContainer>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
          {/* Progress Chart */}
          <BaseChart title="Weekly Progress" delay={400}>
            <AnimatedLineChart 
              data={generateChartData()} 
              height={300}
              delay={400}
            />
          </BaseChart>

          {/* Performance Chart */}
          <BaseChart title="Subject Performance" delay={500}>
            <AnimatedBarChart 
              data={generatePerformanceData()} 
              height={300}
              delay={500}
            />
          </BaseChart>

          {/* Expense Breakdown */}
          <BaseChart title="Expense Breakdown" delay={600}>
            <AnimatedDoughnutChart 
              data={generateExpenseData()} 
              height={300}
              delay={600}
            />
          </BaseChart>

          {/* Progress Overview */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Subject Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {data?.subjects?.map((subject: any, index: number) => (
                <FadeIn key={subject.id} delay={700 + index * 100}>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {subject.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {subject.attendance}%
                      </span>
                      <div className="w-20">
                        <AnimatedProgress 
                          value={subject.attendance} 
                          height="sm"
                          animated={true}
                          color={subject.attendance >= 90 ? 'success' : subject.attendance >= 75 ? 'primary' : 'danger'}
                        />
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <StaggeredContainer staggerDelay={200}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <ScaleIn delay={800}>
              <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-200/50 hover-lift cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Code className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Quick DSA</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Add today's DSA problem</p>
                </CardContent>
              </Card>
            </ScaleIn>

            <ScaleIn delay={900}>
              <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-200/50 hover-lift cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Health Check</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Log your daily health stats</p>
                </CardContent>
              </Card>
            </ScaleIn>

            <ScaleIn delay={1000}>
              <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-200/50 hover-lift cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <DollarSign className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Add Expense</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Track your spending</p>
                </CardContent>
              </Card>
            </ScaleIn>
          </div>
        </StaggeredContainer>
      </div>
    </MainLayout>
  );
}