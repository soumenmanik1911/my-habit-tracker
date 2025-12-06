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
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const result = await toggleTask(task.id);
        if (result.success) {
          onRefresh();
        } else {
          console.error('Failed to toggle task status');
          // Could show toast notification here
        }
      } catch (error) {
        console.error('Toggle error:', error);
      }
    });
  };

  const handleDelete = () => {
    const taskTitle = task.title.length > 30 ? task.title.substring(0, 30) + '...' : task.title;
    if (window.confirm(`Delete "${taskTitle}"?\n\nThis action cannot be undone.`)) {
      setIsDeleting(true);
      startTransition(async () => {
        try {
          const result = await deleteTask(task.id);
          if (result.success) {
            onRefresh();
            // Could add toast notification here if available
          } else {
            alert('Failed to delete task. Please try again.');
            setIsDeleting(false);
          }
        } catch (error) {
          console.error('Delete error:', error);
          alert('An error occurred while deleting the task.');
          setIsDeleting(false);
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
        'group relative bg-gray-900/50 border border-gray-700/50 rounded-xl p-4 sm:p-5 transition-all duration-300 hover-lift',
        task.is_completed && 'opacity-60',
        isSwiping && 'transform translate-x-2'
      )}
    >
      {/* Mobile action buttons - always visible */}
      <div className="flex md:hidden items-center space-x-20 mt-4 pt-4 border-t border-gray-700/30 ">
        <Button
          size="sm"
          onClick={() => onEdit(task)}
          className="flex-1 h-8 bg-blue-500 hover:bg-blue-700 text-white font-medium rounded-lg touch-manipulation"
        >
          <Edit size={13} className="mr-1" />
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={handleDelete}
          disabled={isPending || isDeleting}
          className="flex-1 h-8 font-medium rounded-lg touch-manipulation"
        >
          <Trash2 size={13} className="mr-1" />
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </div>

      <div className="flex items-start space-x-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          disabled={isPending}
          className="mt-1 h-6 w-6 p-0 hover:bg-transparent touch-manipulation"
        >
          {task.is_completed ? (
            <CheckSquare size={20} className="text-green-400" />
          ) : (
            <Square size={20} className="text-gray-400 hover:text-green-400" />
          )}
        </Button>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <h3 className={cn(
              'font-bold text-lg text-white leading-tight pr-2',
              task.is_completed && 'line-through text-gray-400'
            )}>
              {task.title}
            </h3>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full border font-medium whitespace-nowrap shrink-0',
              categoryColors[task.category]
            )}>
              {task.category}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-gray-300 mb-3 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {dueDateText && (
                <div className="flex items-center space-x-1.5 text-sm text-gray-400">
                  <Clock size={14} />
                  <span className="font-medium">{dueDateText}</span>
                </div>
              )}
              <span className={cn('text-xs font-semibold px-2 py-1 rounded-md bg-opacity-20', priorityColors[task.priority])}>
                {task.priority}
              </span>
            </div>

            {/* Desktop action buttons */}
            <div className="hidden md:flex items-center space-x-0.5">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(task)}
                className="h-5 w-5 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded touch-manipulation"
                title="Edit task"
              >
                <Edit size={10} />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                disabled={isPending || isDeleting}
                className="h-5 w-5 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded touch-manipulation"
                title={isDeleting ? "Deleting..." : "Delete task"}
              >
                <Trash2 size={10} />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}