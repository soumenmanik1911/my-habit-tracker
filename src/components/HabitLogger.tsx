'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateHealthTrackerEntry, updateCollegeAttendance } from '@/actions/health';
import { addProblem } from '@/actions/dsa';
import { useToast } from '@/components/ui/toast';

interface HabitLoggerProps {
  onHabitLogged?: () => void;
}

const attendanceOptions = ['Gym', 'Rest Day', 'Not Going to the Gym'] as const;
const moodLabels: Record<number, string> = {
  1: 'Very low',
  2: 'Low',
  3: 'Neutral',
  4: 'Good',
  5: 'Excellent',
};

export default function HabitLogger({ onHabitLogged }: HabitLoggerProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<string>('');
  const [mood, setMood] = useState<string>('');
  const [collegeAttendance, setCollegeAttendance] = useState<boolean | null>(null);
  const [dsaForm, setDsaForm] = useState({
    problemName: '',
    platform: '',
    difficulty: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const handleHealthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendance || !mood) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('date', selectedDate);
      formData.append('attendance', attendance);
      formData.append('mood', mood);

      const result = await updateHealthTrackerEntry(formData);
      if (result.error) {
        addToast({ type: 'error', title: 'Error', message: result.error });
      } else {
        addToast({ type: 'success', title: 'Success', message: 'Health entry logged!' });
        onHabitLogged?.();
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to log health entry' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCollegeSubmit = async (attended: boolean) => {
    setIsLoading(true);
    try {
      const result = await updateCollegeAttendance(selectedDate, attended);
      if (result.error) {
        addToast({ type: 'error', title: 'Error', message: result.error });
      } else {
        addToast({ type: 'success', title: 'Success', message: `College attendance marked as ${attended ? 'present' : 'absent'}!` });
        setCollegeAttendance(attended);
        onHabitLogged?.();
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to log college attendance' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDsaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dsaForm.problemName || !dsaForm.platform || !dsaForm.difficulty) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      Object.entries(dsaForm).forEach(([key, value]) => {
        formData.append(key, value);
      });

      const result = await addProblem(formData);
      if (result.error) {
        addToast({ type: 'error', title: 'Error', message: result.error });
      } else {
        addToast({ type: 'success', title: 'Success', message: 'DSA problem logged!' });
        setDsaForm({ problemName: '', platform: '', difficulty: '' });
        onHabitLogged?.();
      }
    } catch (error) {
      addToast({ type: 'error', title: 'Error', message: 'Failed to log DSA problem' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-white">Select Date</CardTitle>
        </CardHeader>
        <CardContent>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 text-white rounded px-3 py-2 w-full"
          />
        </CardContent>
      </Card>

      {/* DSA Logger */}
      <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-emerald-400">Log DSA Problem</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDsaSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Problem name"
              value={dsaForm.problemName}
              onChange={(e) => setDsaForm(prev => ({ ...prev, problemName: e.target.value }))}
              className="bg-zinc-800 border border-zinc-700 text-white rounded px-3 py-2 w-full"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <Select value={dsaForm.platform} onValueChange={(value) => setDsaForm(prev => ({ ...prev, platform: value }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LeetCode">LeetCode</SelectItem>
                  <SelectItem value="GFG">GFG</SelectItem>
                  <SelectItem value="CodeChef">CodeChef</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dsaForm.difficulty} onValueChange={(value) => setDsaForm(prev => ({ ...prev, difficulty: value }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              Log DSA Problem
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Gym Logger */}
      <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-green-400">Log Gym Session</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleHealthSubmit} className="space-y-4">
            <Select value={attendance} onValueChange={setAttendance}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Gym attendance" />
              </SelectTrigger>
              <SelectContent>
                {attendanceOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Mood" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(moodLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="submit"
              disabled={isLoading || !attendance || !mood}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Log Gym Session
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* College Logger */}
      <Card className="bg-zinc-900/80 backdrop-blur-sm border border-zinc-700/50 rounded-xl">
        <CardHeader>
          <CardTitle className="text-blue-400">Log College Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              onClick={() => handleCollegeSubmit(true)}
              disabled={isLoading}
              className={`${collegeAttendance === true ? 'bg-green-600' : 'bg-zinc-700'} hover:bg-green-700 flex-1`}
            >
              Present
            </Button>
            <Button
              onClick={() => handleCollegeSubmit(false)}
              disabled={isLoading}
              className={`${collegeAttendance === false ? 'bg-red-600' : 'bg-zinc-700'} hover:bg-red-700 flex-1`}
            >
              Absent
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}