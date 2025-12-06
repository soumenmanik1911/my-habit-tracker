'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedDoughnutChart } from '@/components/ui/charts';
import { Brain, Dumbbell, GraduationCap, Wallet, TrendingUp } from 'lucide-react';

interface DashboardData {
  totalSolved: number;
  currentStreak: number;
  gymStreak: number;
  totalExpense: number;
  totalDebt: number;
  attendanceSummary: {
    lowestPercentage: number;
    subjectsAtRisk: number;
  };
  collegeAttendance: {
    totalDays: number;
    presentDays: number;
  };
}

interface ProblemStats {
  difficulty: string;
  count: number;
}

interface StreakData {
  habitType: string;
  currentStreak: number;
  longestStreak: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [problemStats, setProblemStats] = useState<ProblemStats[]>([]);
  const [streaks, setStreaks] = useState<StreakData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [dashboardRes, problemsRes, streaksRes] = await Promise.all([
        fetch('/api/dashboard-stats'),
        fetch('/api/dsa/stats'),
        fetch('/api/streaks')
      ]);

      const [dashboard, problems, streaksData] = await Promise.all([
        dashboardRes.json(),
        problemsRes.json(),
        streaksRes.json()
      ]);

      setData(dashboard);
      setProblemStats(problems);
      setStreaks(streaksData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#10b981';
      case 'Medium': return '#f59e0b';
      case 'Hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const chartData = {
    labels: problemStats.map(stat => stat.difficulty),
    datasets: [{
      data: problemStats.map(stat => stat.count),
      backgroundColor: problemStats.map(stat => getDifficultyColor(stat.difficulty)),
      borderWidth: 0,
    }],
  };

  const totalProblems = problemStats.reduce((sum, stat) => sum + stat.count, 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="border border-gray-800 rounded-xl bg-gray-900/50">
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-6 bg-gray-700 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-indigo-600 bg-clip-text text-transparent">
            DevLife Dashboard
          </h1>
          <p className="text-gray-400 text-sm">Ready to grind? 🚀</p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {/* DSA Total */}
        <Card className="border border-gray-800 rounded-xl bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">DSA Solved</p>
                <p className="text-emerald-400 text-xl font-bold">{data?.totalSolved || 0}</p>
              </div>
              <Brain className="w-5 h-5 text-emerald-400" />
            </div>
          </CardContent>
        </Card>

        {/* DSA Streak */}
        <Card className="border border-gray-800 rounded-xl bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">DSA Streak</p>
                <p className="text-blue-400 text-xl font-bold">{data?.currentStreak || 0}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        {/* Gym Streak */}
        <Card className="border border-gray-800 rounded-xl bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">Gym Streak</p>
                <p className="text-green-400 text-xl font-bold">{data?.gymStreak || 0}</p>
              </div>
              <Dumbbell className="w-5 h-5 text-green-400" />
            </div>
          </CardContent>
        </Card>

        {/* College Attendance */}
        <Card className="border border-gray-800 rounded-xl bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">College Present</p>
                <p className="text-purple-400 text-xl font-bold">{data?.collegeAttendance?.presentDays || 0}</p>
              </div>
              <GraduationCap className="w-5 h-5 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        {/* Total Expense */}
        <Card className="border border-gray-800 rounded-xl bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">Total Expense</p>
                <p className="text-orange-400 text-xl font-bold">₹{(data?.totalExpense || 0).toFixed(0)}</p>
              </div>
              <Wallet className="w-5 h-5 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        {/* Total Debt */}
        <Card className="border border-gray-800 rounded-xl bg-gray-900/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">Total Udhaar</p>
                <p className="text-red-400 text-xl font-bold">₹{(data?.totalDebt || 0).toFixed(0)}</p>
              </div>
              <Wallet className="w-5 h-5 text-red-400" />
            </div>
          </CardContent>
        </Card>

        {/* Problem Difficulty Chart */}
        <Card className="border border-gray-800 rounded-xl bg-gray-900/50 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <span className="text-emerald-400">📊</span>
              Problem Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20">
                <AnimatedDoughnutChart
                  data={chartData}
                  height={80}
                  options={{
                    plugins: { legend: { display: false } },
                    maintainAspectRatio: false,
                  }}
                />
              </div>
              <div className="flex-1 space-y-1">
                {problemStats.map((stat) => {
                  const percentage = totalProblems > 0 ? ((stat.count / totalProblems) * 100).toFixed(0) : '0';
                  return (
                    <div key={stat.difficulty} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getDifficultyColor(stat.difficulty) }}
                        />
                        <span className="text-gray-300">{stat.difficulty}</span>
                      </div>
                      <span className="text-white font-medium">{stat.count} ({percentage}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streaks Overview */}
        <Card className="border border-gray-800 rounded-xl bg-gray-900/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <span className="text-green-400">🔥</span>
              Streaks
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-3">
            {streaks.filter(s => s.habitType !== 'dsa').map((streak) => (
              <div key={streak.habitType} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {streak.habitType === 'gym' && <Dumbbell className="w-3 h-3 text-green-400" />}
                  {streak.habitType === 'college' && <GraduationCap className="w-3 h-3 text-blue-400" />}
                  <span className="text-gray-300 text-xs capitalize">{streak.habitType}</span>
                </div>
                <span className="text-white text-sm font-bold">{streak.currentStreak}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}