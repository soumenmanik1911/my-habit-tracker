'use client';

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, BarChart3, Target, Plus, CheckSquare, Edit, Trash, Home, Code, Dumbbell, BookOpen, Coffee, Heart, Star, Zap, Trophy, Droplets, Moon, Sun, Flame } from 'lucide-react';
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

export default function HabitGridPage() {
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
      borderColor: '#fbbf24', // Electric Gold
      backgroundColor: 'rgba(251, 191, 36, 0.1)',
      tension: 0.4,
      borderWidth: 3,
    }],
  };

  const distributionChartData = {
    labels: analytics?.distribution.map(d => d.day.toString()) || [],
    datasets: [{
      label: 'Habits Completed',
      data: analytics?.distribution.map(d => d.completed) || [],
      backgroundColor: 'rgba(6,182,212,0.8)', // Cyan gradient start
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
    elements: {
      line: {
        borderWidth: 3,
      },
    },
  };

  const totalXP = habits.reduce((acc, habit) => acc + habit.history.filter(Boolean).length, 0) * 25;
  const currentLevel = Math.floor(totalXP / 500) + 1;
  const progressToNext = ((totalXP % 500) / 500) * 100;

  if (loading) {
    return (
      <MainLayout showHeader={true} showSidebar={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showHeader={false} showSidebar={true}>
      <div className="w-full min-h-screen overflow-x-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-3 lg:p-8">
        {/* HUD Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button onClick={() => window.location.href = '/'} variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-white mb-2 neon-glitch animate-flicker tracking-widest">
            Habit Command Center
          </h1>
         
        </div>

        {/* Gamification HUD */}
        <div className="bg-black/80 backdrop-blur-md border border-cyan-500/30 rounded-xl p-4 mb-6" style={{ boxShadow: '0 0 20px rgba(0, 243, 255, 0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="arc-reactor" data-level={currentLevel}></div>
            <div className="flex-1 mx-4">
              <div className="w-full bg-gray-900 h-6 overflow-hidden rounded">
                <div className="plasma-conduit h-full" style={{ width: `${progressToNext}%` }}></div>
              </div>
              <div className="text-sm text-cyan-400 mt-2" style={{ textShadow: '0 0 5px #00f3ff' }}>{totalXP} / {currentLevel * 500} XP</div>
            </div>
          </div>
        </div>

        {/* Mobile-First Layout */}
        <div className="flex flex-col lg:grid lg:grid-cols-1 xl:grid-cols-4 gap-6 mb-8">
          {/* Stats Cards - Top on Mobile */}
          <div className="order-1 lg:order-2 xl:col-span-1">
            <div className="grid grid-cols-3 lg:grid-cols-1 gap-4">
              <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-3 lg:p-4 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-pink-500" style={{ filter: 'drop-shadow(0 0 8px rgba(236,72,153,0.8))' }}>{analytics?.summaryStats.currentStreak || 0}</div>
                  <div className="text-xs lg:text-sm text-gray-400">Current Streak</div>
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-3 lg:p-4 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-cyan-400" style={{ filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.8))' }}>{analytics?.summaryStats.totalActiveHabits || 0}</div>
                  <div className="text-xs lg:text-sm text-gray-400">Active Habits</div>
                </div>
              </div>
              <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-3 lg:p-4 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300">
                <div className="text-center">
                  <div className="text-2xl lg:text-3xl font-bold text-purple-400" style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.8))' }}>{analytics?.summaryStats.completionRate.toFixed(1) || 0}%</div>
                  <div className="text-xs lg:text-sm text-gray-400">Completion Rate</div>
                </div>
              </div>
            </div>
          </div>

          {/* Habit Matrix - Middle on Mobile */}
          <div className="order-2 lg:order-1 xl:col-span-4">
            {/* Habit Grid */}
            <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300">
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
                    <div key={habit.id} className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-4 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300">
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

              {/* Desktop View (Compact Grid - No Scroll) */}
              <div className="hidden lg:block bg-gray-900/40 border border-white/5 rounded-xl p-6">
                
                {/* Master Grid Header */}
                <div className="grid grid-cols-[250px_1fr] gap-4 mb-4 items-center border-b border-white/5 pb-2">
                  <div className="text-pink-500 font-semibold text-lg">Habit</div>
                  {/* Days Header Grid - Forces equal columns */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${daysInMonth}, minmax(0, 1fr))`, gap: '1px' }}>
                    {Array.from({ length: daysInMonth }, (_, i) => (
                      <div key={i} className="text-gray-500 text-center text-[10px] font-medium">
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Habit Rows */}
                <div className="space-y-3">
                  {habits.map((habit) => {
                    const IconComponent = iconOptions.find(i => i.name === habit.icon)?.icon || Target;
                    return (
                      <div key={habit.id} className="grid grid-cols-[250px_1fr] gap-4 items-center rounded-lg p-2 transition-colors hover:bg-gray-800/50 border-b border-white/5">
                        
                        {/* Left Column: Name & Controls */}
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 rounded-md bg-gray-900 text-white shrink-0" style={{ color: habit.color }}>
                             <IconComponent className="h-5 w-5" />
                          </div>
                          <span className="text-white font-medium text-sm truncate" title={habit.name}>{habit.name}</span>
                          
                          {/* Mini Action Buttons (Hidden until hover group) */}
                          <div className="ml-auto flex gap-1 opacity-50 hover:opacity-100">
                             <Button onClick={() => openModal(habit)} size="icon" variant="ghost" className="h-6 w-6 text-gray-400 hover:text-white">
                               <Edit className="h-3 w-3" />
                             </Button>
                             <Button onClick={() => deleteHabit(habit.id)} size="icon" variant="ghost" className="h-6 w-6 text-gray-400 hover:text-red-500">
                               <Trash className="h-3 w-3" />
                             </Button>
                          </div>
                        </div>

                        {/* Right Column: The Checkboxes */}
                        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${daysInMonth}, minmax(0, 1fr))`, gap: '1px' }}>
                          {habit.history.map((completed, dayIndex) => (
                            <button
                              key={dayIndex}
                              onClick={() => toggleCompletion(habit.id, dayIndex)}
                              title={`Day ${dayIndex + 1}`}
                              className={`
                                w-full aspect-[4/5] rounded-[2px] transition-all duration-150 border
                                ${completed
                                  ? 'opacity-100 shadow-[0_0_10px_currentColor] scale-100 hover:scale-110 active:scale-95'
                                  : 'bg-cyan-500/5 border-cyan-500/20 scale-90 hover:scale-110 active:scale-95'}
                              `}
                              style={completed ? { backgroundColor: habit.color } : {}}
                            />
                          ))}
                        </div>

                      </div>
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
              <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300">
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-6 w-6 text-pink-500 mr-3" />
                  <h3 className="text-white font-semibold text-lg">Consistency Trend</h3>
                </div>
                <div className="h-64 lg:h-auto max-w-[100vw]">
                  <Line data={consistencyChartData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } }} />
                </div>
              </div>

              {/* Distribution */}
              <div className="bg-black/60 backdrop-blur-xl border border-cyan-500/20 rounded-xl p-6 hover:border-cyan-500/50 hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition-all duration-300">
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
    </MainLayout>
  );
}