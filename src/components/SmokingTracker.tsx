'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { logCigarette, getSmokingStats } from '@/actions/smoking';

interface SmokingStats {
  totalWasted: number;
  totalCount: number;
  currentStreak: number;
  isVisible: boolean;
  todayCount: number;
}

export default function SmokingTracker() {
  const [stats, setStats] = useState<SmokingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const result = await getSmokingStats();
      if (result.error) {
        console.error('Error fetching smoking stats:', result.error);
        return;
      }
      setStats(result as SmokingStats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogCigarette = () => {
    startTransition(async () => {
      const result = await logCigarette();
      if (result.success) {
        fetchStats(); // Refresh stats
      } else {
        console.error('Error logging cigarette:', result.error);
      }
    });
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900/80 backdrop-blur-sm border border-red-500/20 rounded-xl shadow-lg shadow-red-500/10">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
            <div className="h-6 bg-zinc-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats || !stats.isVisible) {
    return null; // Hidden due to privacy setting
  }

  return (
    <Card className="bg-zinc-900/80 backdrop-blur-sm border border-red-500/20 rounded-xl shadow-lg shadow-red-500/10">
      <CardHeader className="border-b border-zinc-700/50">
        <CardTitle className="text-white flex items-center gap-2">
          <span className="text-red-400">🚬</span>
          Smoke Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {/* Cost Section */}
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">₹{stats.totalWasted.toFixed(2)}</div>
          <div className="text-zinc-400 text-sm">Total Money Wasted</div>
        </div>

        {/* Streak Section */}
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {stats.currentStreak > 0 ? `🔥 ${stats.currentStreak}` : '0'}
          </div>
          <div className="text-zinc-400 text-sm">Days Smoke-Free</div>
        </div>

        {/* Logger Section */}
        <div className="text-center space-y-2">
          <div className="text-lg font-semibold text-white">Today: {stats?.todayCount || 0}</div>
          <Button
            onClick={handleLogCigarette}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 relative overflow-hidden"
          >
            <span className="relative z-10">+1 Cigarette (+₹6)</span>
            {/* Floating animation effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-orange-500 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          </Button>
        </div>

        {/* Total Count */}
        <div className="text-center text-zinc-500 text-xs">
          Total cigarettes: {stats.totalCount}
        </div>
      </CardContent>
    </Card>
  );
}