'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquare } from 'lucide-react';

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

interface AnalyticsOverviewProps {
  tasks: Task[];
}

export default function AnalyticsOverview({ tasks }: AnalyticsOverviewProps) {
  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800/50 border-gray-600/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <CheckSquare className="h-4 w-4 mr-2" />
              Total Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{tasks.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-600/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <CheckSquare className="h-4 w-4 mr-2" />
              Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {tasks.filter(t => t.is_completed).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-600/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <CheckSquare className="h-4 w-4 mr-2" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {tasks.filter(t => !t.is_completed).length}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800/50 border-gray-600/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-400 flex items-center">
              <CheckSquare className="h-4 w-4 mr-2" />
              Overdue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">
              {(() => {
                const now = new Date();
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                return tasks.filter(task => {
                  if (!task.due_date || task.is_completed) return false;
                  const dueDate = new Date(task.due_date.getFullYear(), task.due_date.getMonth(), task.due_date.getDate());
                  return dueDate < today;
                }).length;
              })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="bg-gray-800/50 border-gray-600/50">
        <CardHeader>
          <CardTitle className="text-white">Tasks by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['Academic', 'Personal', 'Exam', 'Project'].map(category => {
              const count = tasks.filter(t => t.category === category).length;
              return (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-gray-300">{category}</span>
                  <span className="text-white font-medium">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}