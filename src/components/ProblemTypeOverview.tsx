'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedDoughnutChart } from '@/components/ui/charts';

interface ProblemStats {
  difficulty: string;
  count: number;
}

export default function ProblemTypeOverview() {
  const [stats, setStats] = useState<ProblemStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProblemStats();
  }, []);

  const fetchProblemStats = async () => {
    try {
      const response = await fetch('/api/dsa/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching problem stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return '#10b981'; // emerald
      case 'Medium':
        return '#f59e0b'; // amber
      case 'Hard':
        return '#ef4444'; // red
      default:
        return '#6b7280'; // gray
    }
  };

  const chartData = {
    labels: stats.map(stat => stat.difficulty),
    datasets: [
      {
        data: stats.map(stat => stat.count),
        backgroundColor: stats.map(stat => getDifficultyColor(stat.difficulty)),
        borderColor: stats.map(stat => getDifficultyColor(stat.difficulty)),
        borderWidth: 2,
      },
    ],
  };

  const totalProblems = stats.reduce((sum, stat) => sum + stat.count, 0);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-zinc-700 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-zinc-700 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Chart Card */}
      <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-lg md:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-white">
            <span className="text-emerald-400">📊</span>
            Problem Difficulty Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatedDoughnutChart
            data={chartData}
            height={250}
            options={{
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: {
                    color: '#e5e7eb',
                    padding: 20,
                  },
                },
              },
            }}
          />
        </CardContent>
      </Card>

      {/* Stats Card */}
      <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-3 text-white">
            <span className="text-blue-400">📈</span>
            Statistics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">{totalProblems}</div>
              <div className="text-zinc-400 text-sm">Total Problems</div>
            </div>
            <div className="space-y-3">
              {stats.map((stat) => {
                const percentage = totalProblems > 0 ? ((stat.count / totalProblems) * 100).toFixed(1) : '0';
                return (
                  <div key={stat.difficulty} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getDifficultyColor(stat.difficulty) }}
                      ></div>
                      <span className="text-sm text-zinc-300">{stat.difficulty}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-white">{stat.count}</div>
                      <div className="text-xs text-zinc-500">{percentage}%</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}