'use client';

import { useState, useEffect } from 'react';

interface YearlyActivity {
  [date: string]: {
    dsa: number;
    gym: boolean;
    college: boolean;
  };
}

interface ContributionGraphData {
  activity: YearlyActivity;
  settings: {
    dsaStreakEnabled: boolean;
    gymMissThreshold: number;
    collegeStreakEnabled: boolean;
  };
  streaks: Array<{
    habitType: string;
    currentStreak: number;
    longestStreak: number;
    lastUpdated: string;
  }>;
}

interface ContributionGraphProps {
  className?: string;
}

export default function ContributionGraph({ className = '' }: ContributionGraphProps) {
  // Calculate the daily score based on DSA count, gym attendance, and college attendance
  const getDailyScore = (dsaCount: number, gymDone: boolean, collegeDone: boolean): number => {
    let score = 0;

    // DSA contribution
    if (dsaCount >= 1) score += 1;
    if (dsaCount > 1) score += 1;

    // Gym contribution
    if (gymDone) score += 1;

    // College contribution
    if (collegeDone) score += 1;

    // Cap at 3+ for visual consistency
    return Math.min(score, 3);
  };

  // Get the color intensity based on the combined score of Gym and DSA
  const getIntensityColor = (score: number): string => {
    switch (score) {
      case 0:
        return 'bg-zinc-900'; // No activity
      case 1:
        return 'bg-emerald-900'; // Light green
      case 2:
        return 'bg-emerald-700'; // Medium green
      case 3:
      default:
        return 'bg-emerald-400 shadow-lg shadow-emerald-400/50'; // Neon green with glow
    }
  };

  const [data, setData] = useState<ContributionGraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ show: boolean; content: string; x: number; y: number }>({
    show: false,
    content: '',
    x: 0,
    y: 0,
  });

  useEffect(() => {
    fetchYearlyActivity();
  }, []);

  const fetchYearlyActivity = async () => {
    try {
      const response = await fetch('/api/yearly-activity');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = await response.json();
      setData(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching yearly activity:', error);
      setError('Failed to load habit data');
    } finally {
      setLoading(false);
    }
  };

  // Generate the calendar grid: 53 weeks x 7 days, starting from Sunday
  const generateCalendarGrid = () => {
    if (!data) return [];

    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364); // 365 days ago

    // Find the Sunday of the week containing the start date
    const startOfWeek = new Date(startDate);
    const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday
    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);

    const grid: { date: string; score: number }[] = [];

    // Generate 53 weeks * 7 days = 371 cells
    for (let week = 0; week < 53; week++) {
      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startOfWeek);
        currentDate.setDate(startOfWeek.getDate() + (week * 7) + day);
        const dateStr = currentDate.toISOString().split('T')[0];
        const activity = data.activity[dateStr] || { dsa: 0, gym: false, college: false };
        const score = getDailyScore(activity.dsa, activity.gym, activity.college);
        grid.push({ date: dateStr, score });
      }
    }

    return grid;
  };

  const formatTooltip = (dateStr: string, dsaCount: number, gymDone: boolean, collegeDone: boolean): string => {
    const date = new Date(dateStr);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();

    let content = `${month} ${day}, ${year}: `;
    const activities = [];

    if (dsaCount > 0) {
      activities.push(`${dsaCount} Problem${dsaCount > 1 ? 's' : ''}`);
    }
    if (gymDone) {
      activities.push('Gym');
    }
    if (collegeDone) {
      activities.push('College');
    }

    if (activities.length > 0) {
      content += activities.join(', ');
    } else {
      content += 'No Activity';
    }

    return content;
  };

  const handleMouseEnter = (event: React.MouseEvent, dateStr: string, dsaCount: number, gymDone: boolean, collegeDone: boolean) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      content: formatTooltip(dateStr, dsaCount, gymDone, collegeDone),
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, content: '', x: 0, y: 0 });
  };

  if (loading) {
    return (
      <div className={`bg-zinc-950 p-4 rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-zinc-700 rounded mb-4"></div>
          <div className="grid grid-rows-7 grid-flow-col gap-1 overflow-x-auto">
            {Array.from({ length: 371 }, (_, i) => (
              <div key={i} className="w-3 h-3 bg-zinc-700 rounded-sm"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-zinc-950 p-4 rounded-lg ${className}`}>
        <h2 className="text-xl font-bold text-white mb-4">The Grind (Last 365 Days)</h2>
        <div className="text-center text-zinc-400 py-8">
          <div className="text-red-400 mb-2">⚠️ {error}</div>
          <div className="text-sm">Please check your database connection and try again.</div>
        </div>
      </div>
    );
  }

  const grid = generateCalendarGrid();

  // For mobile: show only recent 26 weeks (6 months)
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const displayGrid = isMobile ? grid.slice(-182) : grid; // 26 weeks * 7 = 182 cells

  return (
    <div className={`bg-zinc-950 p-4 rounded-lg ${className}`}>
      {/* Header */}
      <h2 className="text-xl font-bold text-white mb-4">The Grind (Last 365 Days)</h2>

      {/* Calendar Grid */}
      <div className="grid grid-rows-7 grid-flow-col gap-1 overflow-x-auto">
        {displayGrid.map((cell, index) => {
          const activity = data?.activity[cell.date] || { dsa: 0, gym: false, college: false };
          const colorClass = getIntensityColor(cell.score);

          return (
            <div
              key={index}
              className={`w-3 h-3 rounded-sm cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-emerald-400/50 ${colorClass}`}
              onMouseEnter={(e) => handleMouseEnter(e, cell.date, activity.dsa, activity.gym, activity.college)}
              onMouseLeave={handleMouseLeave}
              title={formatTooltip(cell.date, activity.dsa, activity.gym, activity.college)}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end mt-4 text-xs text-zinc-400 gap-2">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 bg-zinc-900 rounded-sm"></div>
          <div className="w-3 h-3 bg-emerald-900 rounded-sm"></div>
          <div className="w-3 h-3 bg-emerald-700 rounded-sm"></div>
          <div className="w-3 h-3 bg-emerald-400 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="fixed z-50 bg-black/90 text-white text-xs px-3 py-2 rounded-lg border border-zinc-700 shadow-xl pointer-events-none whitespace-nowrap"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
          }}
        >
          {tooltip.content}
        </div>
      )}
    </div>
  );
}