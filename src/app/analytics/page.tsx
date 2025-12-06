'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Clock, CheckSquare, Target, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { getTasks } from '@/actions/tasks';
import { MainLayout } from '@/components/MainLayout';

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  due_date?: Date;
  is_completed: boolean;
  category: 'Academic' | 'Personal' | 'Exam' | 'Project';
  created_at: Date;
}

interface AnalyticsData {
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  overdueTasks: number;
  todayTasks: number;
  upcomingTasks: number;
  categoryBreakdown: {
    [key: string]: number;
  };
  priorityBreakdown: {
    [key: string]: number;
  };
  weeklyProgress: {
    week: string;
    completed: number;
    created: number;
  }[];
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const fetchAnalytics = async () => {
    try {
      const result = await getTasks();
      if (result.success) {
        const tasks = result.tasks.map((task: any) => ({
          ...task,
          due_date: task.due_date ? new Date(task.due_date) : undefined,
          created_at: new Date(task.created_at)
        }));

        const analyticsData = calculateAnalytics(tasks);
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAnalytics = (tasks: Task[]): AnalyticsData => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const filteredTasks = tasks.filter(task => {
      const createdDate = new Date(task.created_at);
      switch (timeRange) {
        case '7d':
          return createdDate >= weekAgo;
        case '30d':
          return createdDate >= monthAgo;
        default:
          return true;
      }
    });

    const totalTasks = filteredTasks.length;
    const completedTasks = filteredTasks.filter(task => task.is_completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Overdue, Today, Upcoming breakdown
    const overdueTasks = filteredTasks.filter(task => {
      if (!task.due_date || task.is_completed) return false;
      const dueDate = new Date(task.due_date.getFullYear(), task.due_date.getMonth(), task.due_date.getDate());
      return dueDate < today;
    }).length;

    const todayTasks = filteredTasks.filter(task => {
      if (!task.due_date || task.is_completed) return false;
      const dueDate = new Date(task.due_date.getFullYear(), task.due_date.getMonth(), task.due_date.getDate());
      return dueDate.getTime() === today.getTime();
    }).length;

    const upcomingTasks = filteredTasks.filter(task => {
      if (!task.due_date || task.is_completed) return false;
      const dueDate = new Date(task.due_date.getFullYear(), task.due_date.getMonth(), task.due_date.getDate());
      return dueDate > today;
    }).length;

    // Category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    filteredTasks.forEach(task => {
      categoryBreakdown[task.category] = (categoryBreakdown[task.category] || 0) + 1;
    });

    // Priority breakdown
    const priorityBreakdown: { [key: string]: number } = {};
    filteredTasks.forEach(task => {
      priorityBreakdown[task.priority] = (priorityBreakdown[task.priority] || 0) + 1;
    });

    // Weekly progress (last 7 days)
    const weeklyProgress = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const created = filteredTasks.filter(task => {
        const createdDate = new Date(task.created_at);
        return createdDate >= dayStart && createdDate < dayEnd;
      }).length;

      const completed = filteredTasks.filter(task => {
        if (!task.is_completed) return false;
        const completedDate = new Date(task.created_at); // Simplified for demo
        return completedDate >= dayStart && completedDate < dayEnd;
      }).length;

      weeklyProgress.push({
        week: date.toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' }),
        completed,
        created
      });
    }

    return {
      totalTasks,
      completedTasks,
      completionRate,
      overdueTasks,
      todayTasks,
      upcomingTasks,
      categoryBreakdown,
      priorityBreakdown,
      weeklyProgress
    };
  };

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  if (loading) {
    return (
      <MainLayout showHeader={true} showSidebar={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </MainLayout>
    );
  }

  if (!analytics) {
    return (
      <MainLayout showHeader={true} showSidebar={true}>
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold text-white mb-2">No analytics data available</h3>
          <p className="text-gray-400 mb-6">Start creating tasks to see your productivity insights.</p>
          <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
            Create Your First Task
          </Button>
        </div>
      </MainLayout>
    );
  }

  const categoryColors = {
    Academic: 'bg-blue-500',
    Personal: 'bg-green-500',
    Exam: 'bg-red-500',
    Project: 'bg-purple-500'
  };

  const priorityColors = {
    Low: 'text-green-400',
    Medium: 'text-yellow-400',
    High: 'text-orange-400',
    Critical: 'text-red-400'
  };

  return (
    <MainLayout showHeader={true} showSidebar={true}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Analytics</h1>
            <p className="text-gray-400">Track your productivity and task completion patterns</p>
          </div>
          <div className="flex space-x-2">
            {['7d', '30d', '90d'].map((range) => (
              <Button
                key={range}
                onClick={() => setTimeRange(range as '7d' | '30d' | '90d')}
                variant={timeRange === range ? 'default' : 'outline'}
                size="sm"
                className={timeRange === range ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-600 text-gray-300'}
              >
                {range === '7d' ? 'Last 7 days' : range === '30d' ? 'Last 30 days' : 'Last 90 days'}
              </Button>
            ))}
          </div>
        </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <CheckSquare className="h-4 w-4 mr-2" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalTasks}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Completion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.completionRate.toFixed(1)}%</div>
            <Progress value={analytics.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Clock className="h-4 w-4 mr-2" />
              Overdue Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{analytics.overdueTasks}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{analytics.todayTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Tasks by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.categoryBreakdown).map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${categoryColors[category as keyof typeof categoryColors] || 'bg-gray-500'}`}></div>
                    <span className="text-gray-300">{category}</span>
                  </div>
                  <span className="text-white font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Priority Breakdown */}
        <Card className="bg-gray-900/50 border-gray-700/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Tasks by Priority
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analytics.priorityBreakdown).map(([priority, count]) => (
                <div key={priority} className="flex items-center justify-between">
                  <span className={priorityColors[priority as keyof typeof priorityColors]}>{priority}</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card className="bg-gray-900/50 border-gray-700/50">
        <CardHeader>
          <CardTitle className="text-white">Weekly Progress</CardTitle>
          <CardDescription className="text-gray-400">
            Task creation and completion over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.weeklyProgress.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm w-20">{day.week}</span>
                <div className="flex-1 mx-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1">
                      <Progress value={day.created > 0 ? (day.completed / day.created) * 100 : 0} className="h-2" />
                    </div>
                    <span className="text-xs text-gray-400 w-12 text-right">
                      {day.completed}/{day.created}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}