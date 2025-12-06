'use client';

import { useState, useEffect, useTransition } from 'react';
import { updateHealthTrackerEntry } from '@/actions/health';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MainLayout } from '@/components/MainLayout';

interface HealthTrackerRecord {
  id?: number;
  date: string;
  attendance: string;
  mood: number;
}

const attendanceOptions = ['Gym', 'Rest Day', 'Not Going to the Gym'] as const;

const moodLabels: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Excellent',
};

export default function HealthPage() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [attendance, setAttendance] = useState<string>('');
  const [mood, setMood] = useState<string>('');
  const [history, setHistory] = useState<HealthTrackerRecord[]>([]);
  const [message, setMessage] = useState<string>('');
  const [isPending, startTransition] = useTransition();

  const fetchCurrentEntry = async (date: string) => {
    try {
      const response = await fetch(`/api/health/daily?date=${date}`);
      const data = await response.json();

      if (data) {
        setAttendance(data.attendance || '');
        setMood(data.mood ? String(data.mood) : '');
      } else {
        setAttendance('');
        setMood('');
      }
    } catch (error) {
      console.error('Error fetching health entry:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await fetch('/api/health/weekly');
      const data = await response.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching health history:', error);
    }
  };

  useEffect(() => {
    fetchCurrentEntry(selectedDate);
    fetchHistory();
  }, [selectedDate]);

  const handleSubmit = (formData: FormData) => {
    formData.append('date', selectedDate);
    setMessage('');

    startTransition(async () => {
      const result = await updateHealthTrackerEntry(formData);

      if ((result as any).error) {
        setMessage((result as any).error);
      } else {
        setMessage('Health entry saved successfully.');
        fetchCurrentEntry(selectedDate);
        fetchHistory();
      }
    });
  };

  return (
    <MainLayout showHeader={true} showSidebar={true}>
      <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Health Tracker</h1>
        <p className="text-gray-400">
          Log a single daily record with attendance and mood.
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Daily Entry</CardTitle>
          <CardDescription className="text-gray-400">
            Choose your gym attendance and mood for the selected day.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="date" className="text-sm font-medium text-gray-300">
              Date
            </label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white mt-1"
            />
          </div>

          <form action={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Attendance
                </label>
                <Select
                  name="attendance"
                  value={attendance}
                  onValueChange={(value) => setAttendance(value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                    <SelectValue placeholder="Select attendance" />
                  </SelectTrigger>
                  <SelectContent>
                    {attendanceOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">
                  Mood (1–5)
                </label>
                <Select
                  name="mood"
                  value={mood}
                  onValueChange={(value) => setMood(value)}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                    <SelectValue placeholder="How do you feel?" />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <SelectItem key={value} value={String(value)}>
                        {value} - {moodLabels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isPending ? 'Saving...' : 'Save Entry'}
            </Button>
          </form>

          {message && (
            <div
              className={`mt-2 p-3 rounded text-sm ${
                message.toLowerCase().includes('success')
                  ? 'bg-green-900 text-green-300'
                  : 'bg-red-900 text-red-300'
              }`}
            >
              {message}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">History</CardTitle>
          <CardDescription className="text-gray-400">
            All saved days with attendance and mood.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <p className="text-gray-400 text-center py-6">
              No health entries recorded yet.
            </p>
          ) : (
            <div className="max-h-96 overflow-y-auto space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.date}
                  className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {new Date(entry.date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Mood: {entry.mood}/5 ({moodLabels[entry.mood]})
                    </div>
                  </div>
                  <div className="text-sm font-medium text-blue-300">
                    {entry.attendance}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </MainLayout>
  );
}