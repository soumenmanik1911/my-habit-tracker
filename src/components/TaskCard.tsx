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
  Low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  High: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  Critical: 'bg-red-500/20 text-red-400 border-red-500/30'
};

const categoryColors = {
  Academic: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Exam: 'bg-red-500/20 text-red-400 border-red-500/30',
  Project: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Personal: 'bg-green-500/20 text-green-400 border-green-500/30'
};

export function TaskCard({ task, onEdit, onRefresh }: TaskCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggle = () => {
    startTransition(async () => {
      try {
        const result = await toggleTask(task.id);
        if (result.success) {
          onRefresh();
        } else {
          console.error('Failed to toggle task status');
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
        'group relative bg-gray-900/50 border border-gray-700/50 rounded-lg shadow-sm hover:shadow-md transition-all duration-300',
        task.is_completed && 'opacity-60'
      )}
    >
      <div className="flex flex-row items-center p-3 sm:p-4">
        {/* Left Side - Content Area */}
        <div className="flex items-center flex-1 min-w-0">
          {/* Checkbox - Vertically Centered */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={isPending}
            className="h-5 w-5 p-0 hover:bg-transparent touch-manipulation shrink-0 mr-3"
          >
            {task.is_completed ? (
              <CheckSquare size={18} className="text-green-400" />
            ) : (
              <Square size={18} className="text-gray-400 hover:text-green-400" />
            )}
          </Button>

          {/* Task Details Container */}
          <div className="flex-1 min-w-0">
            {/* Task Title */}
            <h3 className={cn(
              'font-semibold text-sm sm:text-base text-white leading-tight mb-1 truncate',
              task.is_completed && 'line-through text-gray-400'
            )}>
              {task.title}
            </h3>

            {/* Metadata Row - Due Date, Priority Badge, Category Tag */}
            <div className="flex items-center space-x-2 flex-wrap">
              {dueDateText && (
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                  <Clock size={12} />
                  <span className="font-medium">{dueDateText}</span>
                </div>
              )}
              
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
            </div>
          </div>
        </div>

        {/* Right Side - Action Area */}
        <div className="flex items-center space-x-1 shrink-0 ml-2">
          {/* Edit Icon Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(task)}
            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md touch-manipulation"
            title="Edit task"
          >
            <Edit size={14} />
          </Button>

          {/* Delete Icon Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDelete}
            disabled={isPending || isDeleting}
            className="h-8 w-8 p-0 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-md touch-manipulation"
            title={isDeleting ? "Deleting..." : "Delete task"}
          >
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}