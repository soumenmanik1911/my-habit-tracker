'use client';

import { useState, useEffect, useImperativeHandle, forwardRef } from 'react';

interface HabitDay {
  date: string;
  dsa: boolean;
  gym: boolean;
  mood: boolean;
  college: boolean;
}

interface HabitMatrixProps {
  className?: string;
  onRefresh?: () => void;
}

export default function HabitMatrix({ className = '', onRefresh }: HabitMatrixProps) {
  const [habitData, setHabitData] = useState<HabitDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);


  useEffect(() => {
    fetchHabitData();
  }, []);

  useEffect(() => {
    // Auto-refresh every 5 minutes to prevent stale data
    const interval = setInterval(() => {
      fetchHabitData(false); // Don't show loading for auto-refresh
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, []); // Remove lastFetch from dependencies to prevent infinite loop

  const fetchHabitData = async (showLoading = false) => {
    if (showLoading) setLoading(true);
    
    try {
      const response = await fetch('/api/habit-matrix', {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      if (!response.ok) {
        console.warn(`HTTP error! status: ${response.status}, using fallback data`);
        // Don't throw error, let the API return fallback data
      }
      
      const data = await response.json();
      setHabitData(Array.isArray(data) ? data : []);
      setLastFetch(new Date());
    } catch (error) {
      console.error('Error fetching habit data:', error);
      
      // Create fallback data for the last 7 days
      const fallbackData = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        fallbackData.push({
          date: date.toISOString().split('T')[0],
          dsa: false,
          gym: false,
          mood: false,
          college: false,
        });
      }
      
      setHabitData(fallbackData);
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function for external calls
  const refreshData = () => {
    fetchHabitData(true);
    if (onRefresh) onRefresh();
  };

  const habits = [
    { key: 'dsa', label: 'DSA', color: 'bg-emerald-500' },
    { key: 'gym', label: 'Gym', color: 'bg-indigo-500' },
    { key: 'mood', label: 'Good Mood', color: 'bg-blue-500' },
    { key: 'college', label: 'College', color: 'bg-amber-500' },
  ];

  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: getLocalDateString(date),
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
        fullDate: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    return days;
  };

  const getHabitStatus = (habitKey: keyof HabitDay, date: string): boolean => {
    const dayData = habitData.find(d => d.date === date);
    return dayData ? Boolean(dayData[habitKey]) : false;
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="space-y-2">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-20 h-4 bg-zinc-700 rounded"></div>
              <div className="flex gap-1">
                {Array.from({ length: 7 }, (_, j) => (
                  <div key={j} className="w-6 h-6 bg-zinc-700 rounded"></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const days = getLast7Days();

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center mb-4">
        <div className="w-20"></div> {/* Space for habit labels */}
        <div className="flex gap-1 flex-1">
          {days.map((day) => (
            <div
              key={day.date}
              className="flex-1 text-center text-xs text-zinc-400 font-medium"
              title={day.fullDate}
            >
              {day.label}
            </div>
          ))}
        </div>
      </div>

      {/* Habit Rows */}
      <div className="space-y-3">
        {habits.map((habit) => (
          <div key={habit.key} className="flex items-center gap-2">
            {/* Habit Label */}
            <div className="w-20 text-sm font-medium text-zinc-300 truncate">
              {habit.label}
            </div>

            {/* Day Cells */}
            <div className="flex gap-1 flex-1">
              {days.map((day) => {
                const isCompleted = getHabitStatus(habit.key as keyof HabitDay, day.date);
                const isToday = day.date === getLocalDateString(new Date());

                return (
                  <div
                    key={day.date}
                    className={`
                      flex-1 aspect-square rounded border transition-all duration-200
                      ${isCompleted
                        ? `${habit.color} border-transparent shadow-lg`
                        : 'bg-zinc-800 border-zinc-700'
                      }
                      ${isToday ? 'ring-2 ring-zinc-400 ring-opacity-50' : ''}
                    `}
                    title={`${habit.label} - ${day.fullDate}: ${isCompleted ? 'Completed' : 'Not completed'}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-zinc-800 border border-zinc-700 rounded"></div>
          <span>Not Done</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded"></div>
          <span>DSA</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-indigo-500 rounded"></div>
          <span>Gym</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span>Mood</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded"></div>
          <span>College</span>
        </div>
      </div>
    </div>
  );
}