'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface GymStats {
  totalDays: number;
  attendedDays: number;
  percentage: number;
  currentStreak: number;
  longestStreak: number;
  thisWeek: number;
}

interface GymAttendanceRecord {
  id?: number;
  date: string;
  attended: boolean;
  workout_type?: string;
  notes?: string;
}

export function GymAttendanceInterface() {
  const [todayAttendance, setTodayAttendance] = useState<GymAttendanceRecord | null>(null);
  const [gymStats, setGymStats] = useState<GymStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    attended: false,
    workout_type: '',
    notes: ''
  });

  const workoutTypes = [
    'Push Day',
    'Pull Day',
    'Leg Day',
    'Chest Day',
    'Back Day',
    'Shoulder Day',
    'Arm Day',
    'Legs & Glutes',
    'Cardio',
    'Full Body',
    'Rest Day',
    'Yoga',
    'Swimming',
    'Cycling',
    'Other'
  ];

  // Fetch today's attendance
  const fetchTodayAttendance = async (date: string) => {
    try {
      const response = await fetch(`/api/gym/attendance?date=${date}`);
      const data = await response.json();
      setTodayAttendance(data);
      setFormData({
        attended: data?.attended || false,
        workout_type: data?.workout_type || '',
        notes: data?.notes || ''
      });
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Fetch gym statistics
  const fetchGymStats = async () => {
    try {
      const response = await fetch('/api/gym/stats?days=30');
      const data = await response.json();
      setGymStats(data);
    } catch (error) {
      console.error('Error fetching gym stats:', error);
    }
  };

  // Handle attendance update
  const handleAttendanceUpdate = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/gym/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          attended: formData.attended,
          workout_type: formData.workout_type || undefined,
          notes: formData.notes || undefined
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage('Gym attendance updated successfully!');
        fetchTodayAttendance(selectedDate);
        fetchGymStats();
      } else {
        setMessage(result.error || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage('Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  // Handle quick attendance buttons
  const handleQuickAttendance = async (attended: boolean) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/gym/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: selectedDate,
          attended: attended,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setMessage(attended ? 'Gym session marked as completed!' : 'Gym session marked as missed!');
        setFormData(prev => ({ ...prev, attended: attended }));
        fetchTodayAttendance(selectedDate);
        fetchGymStats();
      } else {
        setMessage(result.error || 'Failed to update attendance');
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
      setMessage('Failed to update attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance(selectedDate);
    fetchGymStats();
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {gymStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">
                {gymStats.currentStreak} days
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Attendance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-400">
                {gymStats.percentage.toFixed(1)}%
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {gymStats.attendedDays}/{gymStats.totalDays} days
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Longest Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-400">
                {gymStats.longestStreak} days
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-400">
                {gymStats.thisWeek}/7 days
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attendance Marking */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Gym Attendance Tracker</CardTitle>
          <CardDescription className="text-gray-400">
            Track your daily gym sessions with dual-option selection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date Selection */}
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

          {/* Dual-Option Quick Selection */}
          <div className="flex gap-4">
            <Button
              onClick={() => handleQuickAttendance(true)}
              disabled={loading || formData.attended}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600"
            >
              ✅ Yes - Attended
            </Button>
            <Button
              onClick={() => handleQuickAttendance(false)}
              disabled={loading || !formData.attended}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600"
            >
              ❌ No - Absent
            </Button>
          </div>

          {/* Current Status */}
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-white">Current Status</h4>
                <p className="text-sm text-gray-400">
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                formData.attended 
                  ? 'bg-green-900 text-green-300' 
                  : 'bg-red-900 text-red-300'
              }`}>
                {formData.attended ? 'Present' : 'Absent'}
              </div>
            </div>
          </div>

          {/* Detailed Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-300">
                  Workout Type
                </label>
                <Select
                  value={formData.workout_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, workout_type: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white mt-1">
                    <SelectValue placeholder="Select workout type" />
                  </SelectTrigger>
                  <SelectContent>
                    {workoutTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300">
                  Additional Notes
                </label>
                <Input
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional notes..."
                  className="bg-gray-800 border-gray-700 text-white mt-1"
                />
              </div>
            </div>

            <Button
              onClick={handleAttendanceUpdate}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Updating...' : 'Save Details'}
            </Button>
          </div>

          {/* Success/Error Messages */}
          {message && (
            <div className={`p-3 rounded ${
              message.includes('success') 
                ? 'bg-green-900 text-green-300' 
                : 'bg-red-900 text-red-300'
            }`}>
              {message}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}