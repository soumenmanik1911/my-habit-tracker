'use client';

import { useState, useEffect } from 'react';
import { updateAttendance } from '@/actions/attendance';
import { Button } from '@/components/ui/button';

interface AttendanceData {
  id: number;
  subject_name: string;
  total_classes: number;
  attended_classes: number;
  percentage: number;
}

interface AttendanceCalendarProps {
  subject: AttendanceData;
  onUpdate?: () => void;
}

export function AttendanceCalendar({ subject, onUpdate }: AttendanceCalendarProps) {
  const [calendarData, setCalendarData] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttendanceData();
  }, [subject.id]);

  const fetchAttendanceData = async () => {
    try {
      const response = await fetch(`/api/attendance/${subject.id}/calendar`);
      const data = await response.json();
      setCalendarData(data);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    }
  };

  const handleDateToggle = async (date: string, present: boolean) => {
    setLoading(true);
    try {
      // For attendance calendar, we'll treat this as marking a class
      await updateAttendance(subject.id, present ? 'present' : 'absent');
      setCalendarData(prev => ({ ...prev, [date]: present }));
      onUpdate?.();
    } catch (error) {
      console.error('Error updating attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate calendar for current month
  const generateCalendar = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    const days = [];
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      
      days.push({
        date,
        dateStr,
        isCurrentMonth: date.getMonth() === today.getMonth(),
        isToday: dateStr === today.toISOString().split('T')[0],
        attendance: calendarData[dateStr] ?? null
      });
    }
    
    return days;
  };

  const calendar = generateCalendar();

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="mb-4">
        <h3 className="font-medium text-gray-900">{subject.subject_name}</h3>
        <p className="text-sm text-gray-600">
          {subject.percentage.toFixed(1)}% • {subject.attended_classes}/{subject.total_classes} classes
        </p>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day) => (
          <div key={day} className="text-xs text-gray-500 text-center py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {calendar.map((day) => (
          <div
            key={day.dateStr}
            className={`
              aspect-square flex items-center justify-center text-sm rounded cursor-pointer transition-colors
              ${!day.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
              ${day.isToday ? 'bg-blue-100 font-medium' : ''}
            `}
            onClick={() => day.isCurrentMonth && handleDateToggle(day.dateStr, !day.attendance)}
          >
            {day.date.getDate()}
            {day.attendance !== null && (
              <div
                className={`
                  absolute w-2 h-2 rounded-full
                  ${day.attendance ? 'bg-green-500' : 'bg-red-500'}
                `}
              />
            )}
          </div>
        ))}
      </div>
      
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-600">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Present</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span>Absent</span>
        </div>
      </div>
      
      {loading && (
        <div className="text-center py-2 text-sm text-gray-500">
          Updating...
        </div>
      )}
    </div>
  );
}