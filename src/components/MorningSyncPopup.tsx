'use client';

import { useState, useEffect } from 'react';
import { X, CheckSquare, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { fetchTasksWithCache, type CachedTask } from '@/lib/task-cache';
import { cn } from '@/lib/utils';

// Session storage key for popup dismissal
const POPUP_DISMISSED_KEY = 'devlife_morning_popup_dismissed';

// Get user's name from Clerk or default
function getUserName(): string {
  // This would typically come from Clerk user data
  // For now, we'll use a default or try to get from localStorage
  const userName = localStorage.getItem('devlife_user_name');
  return userName || 'there';
}

// Get greeting based on time of day
function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
}

// Task sorting algorithm implementation
function sortTasksForDisplay(tasks: CachedTask[]) {
  // Separate completed tasks (shouldn't be in the API response, but just in case)
  const pendingTasks = tasks.filter(task => !task.is_completed);
  
  // Sort by priority first (Critical -> High -> Medium -> Low)
  const priorityOrder = { 'Critical': 1, 'High': 2, 'Medium': 3, 'Low': 4 };
  const sortedByPriority = [...pendingTasks].sort((a, b) => {
    const aPriority = priorityOrder[a.priority] || 4;
    const bPriority = priorityOrder[b.priority] || 4;
    if (aPriority !== bPriority) return aPriority - bPriority;
    
    // If same priority, sort by due date (earlier first)
    if (a.due_date && b.due_date) {
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    }
    if (a.due_date && !b.due_date) return -1;
    if (!a.due_date && b.due_date) return 1;
    
    // If no due dates, sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Extract Top 5 Priorities
  const top5Priorities = sortedByPriority.slice(0, 5);
  
  // Sort the rest by due date (earliest first)
  const remainingTasks = sortedByPriority.slice(5);
  const sortedByDate = [...remainingTasks].sort((a, b) => {
    // Tasks without due dates go to the end
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return 1;
    if (!b.due_date) return -1;
    
    return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
  });

  return {
    top5Priorities: top5Priorities,
    restOfDay: sortedByDate
  };
}

// Format due date for display
function formatDueDate(dueDateString?: string): string {
  if (!dueDateString) return 'No due date';
  
  const dueDate = new Date(dueDateString);
  const now = new Date();
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return 'Overdue';
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  return `In ${diffDays} days`;
}

// Priority color mapping
const priorityColors = {
  Critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
};

// Category color mapping
const categoryColors = {
  Academic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Exam: 'bg-red-500/20 text-red-400 border-red-500/30',
  Project: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Personal: 'bg-green-500/20 text-green-400 border-green-500/30'
};

interface MorningSyncPopupProps {
  onDismiss: () => void;
}

export function MorningSyncPopup({ onDismiss }: MorningSyncPopupProps) {
  const [tasks, setTasks] = useState<CachedTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [top5Priorities, setTop5Priorities] = useState<CachedTask[]>([]);
  const [restOfDay, setRestOfDay] = useState<CachedTask[]>([]);

  useEffect(() => {
    loadTasksAndSort();
  }, []);

  const loadTasksAndSort = async () => {
    try {
      setLoading(true);
      const fetchedTasks = await fetchTasksWithCache();
      
      if (fetchedTasks.length === 0) {
        setError('No pending tasks found');
      } else {
        const sorted = sortTasksForDisplay(fetchedTasks);
        setTop5Priorities(sorted.top5Priorities);
        setRestOfDay(sorted.restOfDay);
        setError(null);
      }
    } catch (err) {
      setError('Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = () => {
    // Mark popup as dismissed for this session
    sessionStorage.setItem(POPUP_DISMISSED_KEY, 'true');
    onDismiss();
  };

  const handleClose = () => {
    sessionStorage.setItem(POPUP_DISMISSED_KEY, 'true');
    onDismiss();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
            <p className="text-zinc-400">Loading your daily plan...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <Card className="bg-zinc-900 border-zinc-700 max-w-2xl w-full">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-white mb-2">No tasks available</h3>
            <p className="text-zinc-400 mb-6">{error}</p>
            <Button onClick={handleAcknowledge} className="bg-emerald-600 hover:bg-emerald-700">
              Got it!
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="bg-zinc-900 border-zinc-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <CardHeader className="border-b border-zinc-700 relative">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold text-white">
              {getTimeBasedGreeting()}, {getUserName()}! 👋
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X size={18} />
            </Button>
          </div>
          <p className="text-zinc-400 mt-2">Here's your plan for today</p>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Top 5 Priorities Section */}
          {top5Priorities.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="text-red-400" size={20} />
                <h3 className="text-lg font-semibold text-red-400">Top 5 Priorities</h3>
              </div>
              <div className="grid gap-3">
                {top5Priorities.map((task) => (
                  <div
                    key={task.id}
                    className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 hover:bg-red-900/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white text-sm leading-tight">
                          {task.title}
                        </h4>
                        {task.description && (
                          <p className="text-zinc-400 text-xs mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border',
                            priorityColors[task.priority]
                          )}>
                            {task.priority}
                          </span>
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border',
                            categoryColors[task.category]
                          )}>
                            {task.category}
                          </span>
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-zinc-400">
                              <Clock size={12} />
                              <span>{formatDueDate(task.due_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <CheckSquare className="text-zinc-500 ml-3 flex-shrink-0" size={16} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rest of the Day Section */}
          {restOfDay.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="text-blue-400" size={20} />
                <h3 className="text-lg font-semibold text-blue-400">The Rest of Your Day</h3>
              </div>
              <div className="grid gap-2">
                {restOfDay.map((task) => (
                  <div
                    key={task.id}
                    className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-3 hover:bg-zinc-800/70 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white text-sm truncate">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={cn(
                            'text-xs font-medium px-2 py-0.5 rounded-full border',
                            priorityColors[task.priority]
                          )}>
                            {task.priority}
                          </span>
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-zinc-400">
                              <Clock size={10} />
                              <span>{formatDueDate(task.due_date)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <span className={cn(
                          'text-xs font-medium px-2 py-0.5 rounded-full border',
                          categoryColors[task.category]
                        )}>
                          {task.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Tasks State */}
          {top5Priorities.length === 0 && restOfDay.length === 0 && (
            <div className="text-center py-8">
              <div className="text-6xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold text-white mb-2">All caught up!</h3>
              <p className="text-zinc-400">No pending tasks for today. Enjoy your day!</p>
            </div>
          )}

          {/* Acknowledgment Button */}
          <div className="flex justify-center pt-4 border-t border-zinc-700">
            <Button
              onClick={handleAcknowledge}
              className="bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
            >
              Let's Get Started! 🚀
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}