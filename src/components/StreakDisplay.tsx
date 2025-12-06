'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Dumbbell, GraduationCap } from 'lucide-react';

interface StreakData {
  habitType: string;
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string;
}

interface Settings {
  dsaStreakEnabled: boolean;
  gymMissThreshold: number;
  collegeStreakEnabled: boolean;
}

export default function StreakDisplay() {
  const [streaks, setStreaks] = useState<StreakData[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreakData();
  }, []);

  const fetchStreakData = async () => {
    try {
      const [streakResponse, settingsResponse] = await Promise.all([
        fetch('/api/streaks'),
        fetch('/api/settings'),
      ]);

      if (!streakResponse.ok || !settingsResponse.ok) {
        throw new Error('Failed to fetch data');
      }

      const [streakData, settingsData] = await Promise.all([
        streakResponse.json(),
        settingsResponse.json(),
      ]);

      setStreaks(streakData);
      setSettings(settingsData);
    } catch (error) {
      console.error('Error fetching streak data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStreakIcon = (habitType: string) => {
    switch (habitType) {
      case 'dsa':
        return <Brain className="w-6 h-6 text-emerald-400" />;
      case 'gym':
        return <Dumbbell className="w-6 h-6 text-green-400" />;
      case 'college':
        return <GraduationCap className="w-6 h-6 text-blue-400" />;
      default:
        return null;
    }
  };

  const getStreakColor = (habitType: string) => {
    switch (habitType) {
      case 'dsa':
        return 'text-emerald-400';
      case 'gym':
        return 'text-green-400';
      case 'college':
        return 'text-blue-400';
      default:
        return 'text-zinc-400';
    }
  };

  const getHabitName = (habitType: string) => {
    switch (habitType) {
      case 'dsa':
        return 'DSA';
      case 'gym':
        return 'Gym';
      case 'college':
        return 'College';
      default:
        return habitType;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl">
            <CardContent className="p-4">
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
      {streaks.filter(streak => streak.habitType !== 'dsa').map((streak) => {
        const isEnabled = settings ? (
          streak.habitType === 'gym' ? true : // Gym streaks are always enabled but with threshold
          settings.collegeStreakEnabled
        ) : true;

        return (
          <Card key={streak.habitType} className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-white">
                {getStreakIcon(streak.habitType)}
                <span>{getHabitName(streak.habitType)} Streak</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-bold ${getStreakColor(streak.habitType)}`}>
                    {streak.currentStreak}
                  </span>
                  <span className="text-zinc-400 text-sm">days</span>
                </div>
                <div className="text-xs text-zinc-500">
                  Longest: {streak.longestStreak} days
                </div>
                {!isEnabled && (
                  <div className="text-xs text-orange-400">
                    Streaks disabled
                  </div>
                )}
                {streak.habitType === 'gym' && settings && (
                  <div className="text-xs text-zinc-500">
                    Resets after {settings.gymMissThreshold} misses
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}