'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface GymAttendanceRecord {
  id?: number;
  date: string;
  attended: boolean;
  workout_type?: string;
}

interface CalendarDay {
  date: string;
  attended: boolean | null;
  isCurrentMonth: boolean;
  isToday: boolean;
  workoutType?: string;
}

export function GymAttendanceCalendar() {
  const [calendarData, setCalendarData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Fetch attendance data for the month
  const fetchMonthData = async (date: Date) => {
    try {
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const days = Math.ceil((endOfMonth.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      const response = await fetch(`/api/gym/history?days=${days}`);
      const history = await response.json();
      
      const dataMap: Record<string, any> = {};
      history.forEach((record: GymAttendanceRecord) => {
        dataMap[record.date] = record;
      });
      
      setCalendarData(dataMap);
    } catch (error) {
      console.error('Error fetching month data:', error);
    }
  };

  // Toggle attendance for a specific date
  const handleDateToggle = async (date: string, attended: boolean) => {
    setLoading(true);
    try {
      const response = await fetch('/api/gym/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date, attended }),
      });

      const result = await response.json();
      
      if (result.success) {
        setCalendarData(prev => ({
          ...prev,
          [date]: { date, attended }
        }));
        // Refresh the current month data
        fetchMonthData(currentMonth);
      }
    } catch (error) {
      console.error('Error updating attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar days
  const generateCalendar = (): CalendarDay[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    
    // Start from Sunday of the first week
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      days.push({
        date: dateStr,
        attended: calendarData[dateStr]?.attended ?? null,
        isCurrentMonth: date.getMonth() === month,
        isToday: dateStr === today,
        workoutType: calendarData[dateStr]?.workout_type
      });
    }
    
    return days;
  };

  // Navigation functions
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() - 1);
      return newMonth;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + 1);
      return newMonth;
    });
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  useEffect(() => {
    fetchMonthData(currentMonth);
  }, [currentMonth]);

  const calendar = generateCalendar();

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Gym Attendance Calendar</CardTitle>
            <CardDescription className="text-gray-400">
              Track your gym sessions over time
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={goToPreviousMonth}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              ←
            </Button>
            <Button
              onClick={goToToday}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              Today
            </Button>
            <Button
              onClick={goToNextMonth}
              variant="outline"
              size="sm"
              className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700"
            >
              →
            </Button>
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-xs text-gray-400 text-center py-2 font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendar.map((day) => (
            <div
              key={day.date}
              className={`
                aspect-square flex flex-col items-center justify-center text-sm rounded cursor-pointer transition-all relative
                ${!day.isCurrentMonth ? 'text-gray-600' : 'text-gray-200'}
                ${day.isToday ? 'bg-blue-900 border border-blue-500' : 'hover:bg-gray-800'}
                ${loading ? 'pointer-events-none opacity-50' : ''}
              `}
              onClick={() => day.isCurrentMonth && handleDateToggle(day.date, !day.attended)}
            >
              <span className={`font-medium ${day.isToday ? 'text-blue-300' : ''}`}>
                {day.date.split('-')[2].replace(/^0/, '')}
              </span>
              
              {/* Status indicator */}
              {day.attended !== null && (
                <div className="flex flex-col items-center mt-1">
                  <div
                    className={`
                      w-3 h-3 rounded-full
                      ${day.attended ? 'bg-green-500' : 'bg-red-500'}
                    `}
                  />
                  {day.workoutType && (
                    <span className="text-xs text-gray-400 mt-1 truncate max-w-full px-1">
                      {day.workoutType.split(' ')[0]}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Attended</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
            <span>Not logged</span>
          </div>
        </div>
        
        {loading && (
          <div className="text-center py-2 text-sm text-gray-500">
            Updating attendance...
          </div>
        )}
      </CardContent>
    </Card>
  );
}