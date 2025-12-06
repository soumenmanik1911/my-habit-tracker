'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { updateTaskDetails } from '@/actions/tasks';
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

interface TaskDrawerProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function TaskDrawer({ task, open, onOpenChange, onRefresh }: TaskDrawerProps) {
  const [isPending, startTransition] = useTransition();
  const [editedTask, setEditedTask] = useState<Task | null>(null);

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  const handleSave = (field: keyof Task, value: any) => {
    if (!editedTask) return;

    startTransition(async () => {
      const updateData: any = {};
      updateData[field] = value;

      const result = await updateTaskDetails(editedTask.id, updateData);
      if (result.success) {
        setEditedTask(prev => prev ? { ...prev, [field]: value } : null);
        onRefresh();
      }
    });
  };

  const handlePriorityChange = (value: string) => {
    handleSave('priority', value as 'Low' | 'Medium' | 'High' | 'Critical');
  };

  const handleCategoryChange = (value: string) => {
    handleSave('category', value as 'Academic' | 'Personal' | 'Exam' | 'Project');
  };

  const handleDateChange = (dateString: string) => {
    const date = dateString ? new Date(dateString) : null;
    handleSave('due_date', date);
  };

  if (!editedTask) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md bg-gray-900 border-gray-700">
        <SheetHeader>
          <SheetTitle className="text-white flex items-center justify-between">
            Edit Task
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-6 w-6 p-0"
            >
              <X size={16} />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <Input
              value={editedTask.title}
              onChange={(e) => setEditedTask(prev => prev ? { ...prev, title: e.target.value } : null)}
              onBlur={(e) => handleSave('title', e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              value={editedTask.description || ''}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedTask(prev => prev ? { ...prev, description: e.target.value } : null)}
              onBlur={(e: React.FocusEvent<HTMLTextAreaElement>) => handleSave('description', e.target.value)}
              placeholder="Add notes about this task..."
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-md px-3 py-2 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isPending}
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Due Date
            </label>
            <div className="relative">
              <Input
                type="datetime-local"
                value={editedTask.due_date ? new Date(editedTask.due_date).toISOString().slice(0, 16) : ''}
                onChange={(e) => handleDateChange(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white pl-10"
                disabled={isPending}
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Priority
            </label>
            <Select
              value={editedTask.priority}
              onValueChange={handlePriorityChange}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="Low" className="text-green-400">Low</SelectItem>
                <SelectItem value="Medium" className="text-yellow-400">Medium</SelectItem>
                <SelectItem value="High" className="text-orange-400">High</SelectItem>
                <SelectItem value="Critical" className="text-red-400">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <Select
              value={editedTask.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="Academic">Academic</SelectItem>
                <SelectItem value="Personal">Personal</SelectItem>
                <SelectItem value="Exam">Exam</SelectItem>
                <SelectItem value="Project">Project</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Task Info */}
          <div className="pt-4 border-t border-gray-700">
            <div className="text-xs text-gray-400 space-y-1">
              <div>Created: {new Date(editedTask.created_at).toLocaleDateString()}</div>
              <div>Status: {editedTask.is_completed ? 'Completed' : 'Pending'}</div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}