'use client';

import { useState } from 'react';
import { CheckSquare, Square, Clock, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toggleTask, deleteTask } from '@/actions/tasks';
import { useTransition } from 'react';

interface Task {
  id: number;
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  due_date?: Date;
  is_completed: boolean;
  category: 'Academic' | 'Personal' | 'Exam' | 'Project';
  created_at: Date;
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onRefresh: () => void;
}

const priorityColors = {
  Low: 'text-green-400',
  Medium: 'text-yellow-400',
  High: 'text-orange-400',
  Critical: 'text-red-400'
};

const categoryColors = {
  Academic: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  Exam: 'bg-red-500/20 text-red-400 border-red-500/50',
  Project: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  Personal: 'bg-green-500/20 text-green-400 border-green-500/50'
};

export function TaskCard({ task, onEdit, onRefresh }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isSwiping, setIsSwiping] = useState(false);

  const handleToggle = () => {
    startTransition(async () => {
      const result = await toggleTask(task.id);
      if (result.success) {
        onRefresh();
      }
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this task?')) {
      startTransition(async () => {
        const result = await deleteTask(task.id);
        if (result.success) {
          onRefresh();
        }
      });
    }
  };

  const formatDueDate = (date?: Date) => {
    if (!date) return null;
    const now = new Date();
    const dueDate = new Date(date);
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return 'Overdue';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    return `In ${diffDays} days`;
  };

  const dueDateText = formatDueDate(task.due_date ? new Date(task.due_date) : undefined);

  return (
    <div
      className={cn(
        'group relative bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 transition-all duration-300 hover-lift',
        task.is_completed && 'opacity-60',
        isSwiping && 'transform translate-x-2'
      )}
    >
      {/* Mobile swipe actions overlay */}
      <div className="absolute -right-16 top-0 h-full flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity md:hidden">
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isPending}
          className="h-8 w-8 p-0"
        >
          <Trash2 size={14} />
        </Button>
        <Button
          size="sm"
          onClick={() => onEdit(task)}
          className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700"
        >
          <Edit size={14} />
        </Button>
      </div>

      <div className="flex items-start space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          disabled={isPending}
          className="mt-0.5 h-5 w-5 p-0 hover:bg-transparent"
        >
          {task.is_completed ? (
            <CheckSquare size={20} className="text-green-400" />
          ) : (
            <Square size={20} className="text-gray-400 hover:text-green-400" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h3 className={cn(
              'font-medium text-white truncate',
              task.is_completed && 'line-through text-gray-400'
            )}>
              {task.title}
            </h3>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full border',
              categoryColors[task.category]
            )}>
              {task.category}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-gray-400 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {dueDateText && (
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>{dueDateText}</span>
                </div>
              )}
              <span className={cn('text-xs font-medium', priorityColors[task.priority])}>
                {task.priority}
              </span>
            </div>

            {/* Desktop action buttons */}
            <div className="hidden md:flex items-center space-x-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(task)}
                className="h-7 px-2 text-xs text-gray-400 hover:text-blue-400"
              >
                <Edit size={12} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isPending}
                className="h-7 px-2 text-xs text-gray-400 hover:text-red-400"
              >
                <Trash2 size={12} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}