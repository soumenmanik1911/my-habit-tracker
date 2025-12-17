'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, BarChart3, Target, Plus, CheckSquare, Edit, Trash, Code, Dumbbell, BookOpen, Coffee, Heart, Star, Zap, Trophy, Droplets, Moon, Sun, Flame } from 'lucide-react';
import { CyberpunkHeader } from '@/components/ui/CyberpunkHeader';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface Habit {
  id: number;
  name: string;
  goal: number;
  icon: string;
  color: string;
  history: boolean[];
}

interface HabitAnalytics {
  consistencyTrend: { date: string; completionRate: number }[];
  distribution: { day: number; completed: number }[];
  summaryStats: {
    currentStreak: number;
    totalActiveHabits: number;
    completionRate: number;
  };
}

const neonColors = [
  { name: 'Neon Pink', value: '#ec4899' },
  { name: 'Neon Blue', value: '#3b82f6' },
  { name: 'Neon Green', value: '#10b981' },
  { name: 'Neon Purple', value: '#8b5cf6' },
  { name: 'Neon Orange', value: '#f97316' },
  { name: 'Neon Red', value: '#ef4444' },
  { name: 'Neon Yellow', value: '#eab308' },
  { name: 'Neon Cyan', value: '#06b6d4' },
];

const iconOptions = [
  { name: 'Target', icon: Target },
  { name: 'Code', icon: Code },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Coffee', icon: Coffee },
  { name: 'Heart', icon: Heart },
  { name: 'Star', icon: Star },
  { name: 'Zap', icon: Zap },
  { name: 'Trophy', icon: Trophy },
  { name: 'Droplets', icon: Droplets },
  { name: 'Moon', icon: Moon },
  { name: 'Sun', icon: Sun },
  { name: 'Flame', icon: Flame },
];

const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function HabitGridComponent() {
   const [habits, setHabits] = useState<Habit[]>([]);
   const [analytics, setAnalytics] = useState<HabitAnalytics | null>(null);
   const [loading, setLoading] = useState(true);
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
   const [habitForm, setHabitForm] = useState({
     name: '',
     goal: 1,
     icon: 'Target',
     color: '#10b981'
   });
   const now = new Date();
   const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  useEffect(() => {
    fetchHabits();
    fetchAnalytics();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habit-grid');
      if (response.ok) {
        const data = await response.json();
        setHabits(data);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/habit-analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = (habit?: Habit) => {
    if (habit) {
      setEditingHabit(habit);
      setHabitForm({
        name: habit.name,
        goal: habit.goal,
        icon: habit.icon,
        color: habit.color,
      });
    } else {
      setEditingHabit(null);
      setHabitForm({
        name: '',
        goal: 1,
        icon: 'Target',
        color: '#10b981',
      });
    }
    setIsModalOpen(true);
  };

  const saveHabit = async () => {
    if (!habitForm.name.trim()) return;

    try {
      const method = editingHabit ? 'PUT' : 'POST';
      const body = editingHabit
        ? { id: editingHabit.id, ...habitForm }
        : habitForm;

      const response = await fetch('/api/habit-grid', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        if (editingHabit) {
          setHabits(habits.map(h => h.id === editingHabit.id ? { ...h, ...habitForm } : h));
        } else {
          const habit = await response.json();
          setHabits([...habits, habit]);
        }
        setIsModalOpen(false);
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error saving habit:', error);
    }
  };

  const deleteHabit = async (habitId: number) => {
    try {
      const response = await fetch('/api/habit-grid', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: habitId }),
      });

      if (response.ok) {
        setHabits(habits.filter(h => h.id !== habitId));
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
    }
  };

  const toggleCompletion = async (habitId: number, dayIndex: number) => {
    if (dayIndex >= daysInMonth) return; // Prevent clicking invalid days

    const date = new Date(now.getFullYear(), now.getMonth(), dayIndex + 1);
    const dateStr = getLocalDateString(date);
    const completed = !habits.find(h => h.id === habitId)?.history[dayIndex];

    try {
      const response = await fetch('/api/habit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId, date: dateStr, completed }),
      });

      if (response.ok) {
        setHabits(habits.map(habit =>
          habit.id === habitId
            ? { ...habit, history: habit.history.map((val, i) => i === dayIndex ? completed : val) }
            : habit
        ));
        fetchAnalytics();
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const consistencyChartData = {
    labels: analytics?.consistencyTrend.map(d => new Date(d.date).toLocaleDateString('en', { month: 'short', day: 'numeric' })) || [],
    datasets: [{
      label: 'Completion Rate (%)',
      data: analytics?.consistencyTrend.map(d => d.completionRate) || [],
      borderColor: '#fbbf24', // Yellow/Gold
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      tension: 0.4,
    }],
  };

  const distributionChartData = {
    labels: analytics?.distribution.map(d => d.day.toString()) || [],
    datasets: [{
      label: 'Habits Completed',
      data: analytics?.distribution.map(d => d.completed) || [],
      backgroundColor: '#10b981', // Green
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const totalXP = habits.reduce((acc, habit) => acc + habit.history.filter(Boolean).length, 0) * 25;
  const currentLevel = Math.floor(totalXP / 500) + 1;
  const progressToNext = ((totalXP % 500) / 500) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-3 lg:p-8">
      {/* Cyberpunk Header */}
      <CyberpunkHeader title="Habit Command Center" level={currentLevel} />

      {/* Gamification HUD */}
      <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-purple-500">Lvl {currentLevel}</div>
            <div className="text-sm text-gray-400">{totalXP} / {currentLevel * 500} XP</div>
          </div>
          <div className="flex-1 mx-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${progressToNext}%` }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-First Layout */}
      <div className="flex flex-col lg:grid lg:grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
        {/* Stats Cards - Top on Mobile */}
        <div className="order-1 lg:order-2 xl:col-span-1">
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3 lg:p-4">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-pink-500">{analytics?.summaryStats.currentStreak || 0}</div>
                <div className="text-xs lg:text-sm text-gray-400">Current Streak</div>
              </div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3 lg:p-4">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-green-500">{analytics?.summaryStats.totalActiveHabits || 0}</div>
                <div className="text-xs lg:text-sm text-gray-400">Active Habits</div>
              </div>
            </div>
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl p-3 lg:p-4">
              <div className="text-center">
                <div className="text-2xl lg:text-3xl font-bold text-white">{analytics?.summaryStats.completionRate.toFixed(1) || 0}%</div>
                <div className="text-xs lg:text-sm text-gray-400">Completion Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Habit Matrix - Middle on Mobile */}
        <div className="order-2 lg:order-1 xl:col-span-4">
          {/* Habit Grid */}
          <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Habit Matrix</h2>
              {/* Desktop Add Button */}
              <div className="hidden md:block">
                <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => openModal()} className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Habit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-white/10">
                    <DialogHeader>
                      <DialogTitle className="text-white">{editingHabit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Habit Name</label>
                        <Input
                          value={habitForm.name}
                          onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="e.g., Morning Workout"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Frequency Goal</label>
                        <Input
                          type="number"
                          value={habitForm.goal}
                          onChange={(e) => setHabitForm({ ...habitForm, goal: parseInt(e.target.value) || 1 })}
                          className="bg-gray-800 border-gray-600 text-white"
                          placeholder="Aim for X days/month"
                          min="1"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Choose Color</label>
                        <div className="grid grid-cols-4 gap-2">
                          {neonColors.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => setHabitForm({ ...habitForm, color: color.value })}
                              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                                habitForm.color === color.value ? 'border-white scale-110' : 'border-gray-600'
                              }`}
                              style={{ backgroundColor: color.value }}
                            />
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Choose Icon</label>
                        <div className="grid grid-cols-6 gap-2">
                          {iconOptions.map((iconOption) => {
                            const IconComponent = iconOption.icon;
                            return (
                              <button
                                key={iconOption.name}
                                onClick={() => setHabitForm({ ...habitForm, icon: iconOption.name })}
                                className={`p-3 rounded-lg border-2 transition-all ${
                                  habitForm.icon === iconOption.name ? 'border-white scale-110 bg-white/10' : 'border-gray-600 hover:border-gray-500'
                                }`}
                              >
                                <IconComponent className="h-6 w-6 text-white" />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <Button onClick={saveHabit} className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                        {editingHabit ? 'Update Habit' : 'Create Habit'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {/* Mobile View (5x6 Matrix) */}
            <div className="lg:hidden space-y-6">
              {habits.map((habit) => {
                const IconComponent = iconOptions.find(i => i.name === habit.icon)?.icon || Target;
                return (
                  <div key={habit.id} className="bg-gray-900/80 border border-white/10 rounded-xl p-4">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <IconComponent className="h-6 w-6" style={{ color: habit.color }} />
                        <span className="font-bold text-lg">{habit.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => openModal(habit)}
                          variant="ghost"
                          size="sm"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => deleteHabit(habit.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-500"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {/* The 5x6 Matrix */}
                    <div className="grid grid-cols-6 gap-3">
                      {habit.history.map((completed, i) => (
                        <button
                          key={i}
                          onClick={() => toggleCompletion(habit.id, i)}
                          className={`aspect-square rounded-md border-2 flex items-center justify-center text-xs font-bold transition-all ${
                            completed ? 'border-transparent text-black' : 'border-white/10 bg-white/5 text-gray-500'
                          }`}
                          style={completed ? { backgroundColor: habit.color } : {}}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop View (CSS Grid Layout) */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-[200px_1fr] gap-4">
                {/* Header Row */}
                <div className="text-pink-500 font-semibold text-lg">Habit</div>
                <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${daysInMonth}, 1fr)` }}>
                  {Array.from({ length: daysInMonth }, (_, i) => (
                    <div key={i} className="text-[10px] text-center text-gray-500">
                      {i + 1}
                    </div>
                  ))}
                </div>

                {/* Habit Rows */}
                {habits.map((habit) => {
                  const IconComponent = iconOptions.find(i => i.name === habit.icon)?.icon || Target;
                  return (
                    <>
                      <div className="flex items-center gap-2 overflow-hidden">
                        <IconComponent className="w-5 h-5 flex-shrink-0" style={{ color: habit.color }} />
                        <span className="truncate text-sm font-medium text-white">{habit.name}</span>
                        <div className="ml-auto flex items-center gap-2">
                          <Button
                            onClick={() => openModal(habit)}
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white flex-shrink-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => deleteHabit(habit.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-500 flex-shrink-0"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${daysInMonth}, 1fr)` }}>
                        {habit.history.map((completed, i) => (
                          <button
                            key={i}
                            onClick={() => toggleCompletion(habit.id, i)}
                            className={`w-full aspect-square rounded-sm transition-all ${
                              completed ? 'opacity-100 shadow-[0_0_8px_rgba(0,0,0,0.5)]' : 'bg-white/5 hover:bg-white/10'
                            }`}
                            style={{ backgroundColor: completed ? habit.color : undefined }}
                          />
                        ))}
                      </div>
                    </>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Charts - Bottom on Mobile */}
        <div className="order-3 xl:col-span-3">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Consistency Trend */}
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <TrendingUp className="h-6 w-6 text-pink-500 mr-3" />
                <h3 className="text-white font-semibold text-lg">Consistency Trend</h3>
              </div>
              <div className="h-64 lg:h-auto max-w-[100vw]">
                <Line data={consistencyChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
              </div>
            </div>

            {/* Distribution */}
            <div className="bg-gray-900/60 backdrop-blur-md border border-white/10 rounded-xl p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-6 w-6 text-pink-500 mr-3" />
                <h3 className="text-white font-semibold text-lg">Daily Distribution</h3>
              </div>
              <div className="h-64 lg:h-auto max-w-[100vw]">
                <Bar data={distributionChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Mobile FAB */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogTrigger asChild>
          <Button
            onClick={() => openModal()}
            className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 shadow-lg"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-gray-900 border-white/10 mx-4">
          <DialogHeader>
            <DialogTitle className="text-white">{editingHabit ? 'Edit Habit' : 'Create New Habit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Habit Name</label>
              <Input
                value={habitForm.name}
                onChange={(e) => setHabitForm({ ...habitForm, name: e.target.value })}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="e.g., Morning Workout"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Frequency Goal</label>
              <Input
                type="number"
                value={habitForm.goal}
                onChange={(e) => setHabitForm({ ...habitForm, goal: parseInt(e.target.value) || 1 })}
                className="bg-gray-800 border-gray-600 text-white"
                placeholder="Aim for X days/month"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Choose Color</label>
              <div className="grid grid-cols-4 gap-2">
                {neonColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => setHabitForm({ ...habitForm, color: color.value })}
                    className={`w-12 h-12 rounded-lg border-2 transition-all ${
                      habitForm.color === color.value ? 'border-white scale-110' : 'border-gray-600'
                    }`}
                    style={{ backgroundColor: color.value }}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Choose Icon</label>
              <div className="grid grid-cols-6 gap-2">
                {iconOptions.map((iconOption) => {
                  const IconComponent = iconOption.icon;
                  return (
                    <button
                      key={iconOption.name}
                      onClick={() => setHabitForm({ ...habitForm, icon: iconOption.name })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        habitForm.icon === iconOption.name ? 'border-white scale-110 bg-white/10' : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <IconComponent className="h-6 w-6 text-white" />
                    </button>
                  );
                })}
              </div>
            </div>

            <Button onClick={saveHabit} className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
              {editingHabit ? 'Update Habit' : 'Create Habit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}