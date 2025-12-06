'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

interface Settings {
  dsaStreakEnabled: boolean;
  gymMissThreshold: number;
  collegeStreakEnabled: boolean;
}

export default function HabitSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Error fetching settings:', error);
      addToast({ type: 'error', title: 'Error', message: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (key: string, value: string | boolean) => {
    if (!settings) return;

    const newSettings = { ...settings };

    if (key === 'dsa_streak_enabled') {
      newSettings.dsaStreakEnabled = value as boolean;
    } else if (key === 'gym_miss_threshold') {
      newSettings.gymMissThreshold = parseInt(value as string);
    } else if (key === 'college_streak_enabled') {
      newSettings.collegeStreakEnabled = value as boolean;
    }

    setSettings(newSettings);

    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key, value }),
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }

      addToast({ type: 'success', title: 'Success', message: 'Settings updated!' });
    } catch (error) {
      console.error('Error updating setting:', error);
      addToast({ type: 'error', title: 'Error', message: 'Failed to update setting' });
      // Revert on error
      fetchSettings();
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-zinc-700 rounded w-1/3"></div>
            <div className="h-8 bg-zinc-700 rounded"></div>
            <div className="h-8 bg-zinc-700 rounded"></div>
            <div className="h-8 bg-zinc-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) return null;

  return (
    <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl">
      <CardHeader>
        <CardTitle className="text-white">Habit Tracking Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* DSA Streak Settings */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">DSA Streaks</h3>
            <p className="text-zinc-400 text-sm">Enable/disable streak tracking for DSA problems</p>
          </div>
          <input
            type="checkbox"
            checked={settings.dsaStreakEnabled}
            onChange={(e) => handleSettingChange('dsa_streak_enabled', e.target.checked)}
            disabled={saving}
            className="h-4 w-4 text-emerald-600 bg-zinc-800 border-zinc-700 rounded"
          />
        </div>

        {/* Gym Miss Threshold */}
        <div className="space-y-2">
          <div>
            <h3 className="text-white font-medium">Gym Miss Threshold</h3>
            <p className="text-zinc-400 text-sm">Number of consecutive misses before resetting gym streak</p>
          </div>
          <Select
            value={settings.gymMissThreshold.toString()}
            onValueChange={(value) => handleSettingChange('gym_miss_threshold', value)}
          >
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 miss</SelectItem>
              <SelectItem value="2">2 misses</SelectItem>
              <SelectItem value="3">3 misses</SelectItem>
              <SelectItem value="5">5 misses</SelectItem>
              <SelectItem value="7">7 misses</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* College Streak Settings */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-medium">College Streaks</h3>
            <p className="text-zinc-400 text-sm">Enable/disable streak tracking for college attendance</p>
          </div>
          <input
            type="checkbox"
            checked={settings.collegeStreakEnabled}
            onChange={(e) => handleSettingChange('college_streak_enabled', e.target.checked)}
            disabled={saving}
            className="h-4 w-4 text-blue-600 bg-zinc-800 border-zinc-700 rounded"
          />
        </div>

        {saving && (
          <div className="text-center text-zinc-400 text-sm">
            Saving settings...
          </div>
        )}
      </CardContent>
    </Card>
  );
}