'use client';

import { useState, useEffect } from 'react';

interface ActivityDay {
  date: string;
  dsaCount: number;
  gymActivity: boolean;
  expenseCount: number;
}

interface ContributionHeatmapProps {
  className?: string;
}

export default function ContributionHeatmap({ className = '' }: ContributionHeatmapProps) {
  const [activityData, setActivityData] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ show: boolean; content: string; x: number; y: number }>({
    show: false,
    content: '',
    x: 0,
    y: 0,
  });

  useEffect(() => {
    fetchActivityData();
  }, []);

  const fetchActivityData = async () => {
    try {
      const response = await fetch('/api/activity-history');
      const data = await response.json();
      setActivityData(data);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityLevel = (day: ActivityDay): number => {
    if (day.dsaCount === 0 && !day.gymActivity) return 0; // No activity
    if (day.dsaCount === 1 && !day.gymActivity) return 1; // Light activity
    if (day.dsaCount >= 3 || (day.dsaCount >= 1 && day.gymActivity)) return 3; // High activity
    return 2; // Medium activity
  };

  const getActivityColor = (level: number): string => {
    switch (level) {
      case 0: return 'bg-zinc-800'; // No activity
      case 1: return 'bg-emerald-900'; // Light green
      case 2: return 'bg-emerald-600'; // Medium green
      case 3: return 'bg-emerald-400 shadow-lg shadow-emerald-400/50'; // Bright green with glow
      default: return 'bg-zinc-800';
    }
  };

  const formatTooltip = (day: ActivityDay): string => {
    const date = new Date(day.date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let content = `${date}\n`;
    if (day.dsaCount > 0) {
      content += `${day.dsaCount} Problem${day.dsaCount > 1 ? 's' : ''} Solved`;
    }
    if (day.gymActivity) {
      content += `${day.dsaCount > 0 ? ', ' : ''}Gym: Yes`;
    }
    if (day.dsaCount === 0 && !day.gymActivity) {
      content += 'No Activity';
    }

    return content;
  };

  const generateCalendar = () => {
    const weeks: ActivityDay[][] = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 364); // 365 days ago

    // Create a map for quick lookup
    const activityMap = new Map(activityData.map(day => [day.date, day]));

    // Generate 53 weeks (to fill the grid)
    for (let week = 0; week < 53; week++) {
      const weekData: ActivityDay[] = [];

      for (let day = 0; day < 7; day++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + (week * 7) + day);

        const dateStr = currentDate.toISOString().split('T')[0];
        const activity = activityMap.get(dateStr) || {
          date: dateStr,
          dsaCount: 0,
          gymActivity: false,
          expenseCount: 0,
        };

        weekData.push(activity);
      }

      weeks.push(weekData);
    }

    return weeks;
  };

  const handleMouseEnter = (event: React.MouseEvent, day: ActivityDay) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      show: true,
      content: formatTooltip(day),
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, content: '', x: 0, y: 0 });
  };

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="grid grid-cols-53 gap-0.5 sm:gap-1 overflow-x-auto">
          {Array.from({ length: 371 }, (_, i) => (
            <div key={i} className="w-2 h-2 sm:w-3 sm:h-3 bg-zinc-700 rounded-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  const weeks = generateCalendar();

  return (
    <div className={`relative ${className}`}>
      {/* Month Labels */}
      <div className="flex mb-2 text-xs text-zinc-400">
        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
          <div key={month} className="flex-1 text-center">
            {month}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-53 gap-0.5 sm:gap-1 overflow-x-auto">
        {weeks.map((week, weekIndex) =>
          week.map((day, dayIndex) => {
            const level = getActivityLevel(day);
            const colorClass = getActivityColor(level);

            return (
              <div
                key={`${weekIndex}-${dayIndex}`}
                className={`w-2 h-2 sm:w-3 sm:h-3 rounded-sm cursor-pointer transition-all duration-200 hover:ring-2 hover:ring-emerald-400/50 ${colorClass}`}
                onMouseEnter={(e) => handleMouseEnter(e, day)}
                onMouseLeave={handleMouseLeave}
                title={formatTooltip(day)}
              />
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center sm:justify-end mt-4 text-xs text-zinc-400 gap-2">
        <span>Less</span>
        <div className="flex gap-0.5 sm:gap-1">
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-zinc-800 rounded-sm"></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-900 rounded-sm"></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-600 rounded-sm"></div>
          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-400 rounded-sm"></div>
        </div>
        <span>More</span>
      </div>

      {/* Tooltip */}
      {tooltip.show && (
        <div
          className="fixed z-50 bg-black/90 text-white text-xs px-3 py-2 rounded-lg border border-zinc-700 shadow-xl pointer-events-none whitespace-pre-line"
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