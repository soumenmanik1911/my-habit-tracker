'use client';

import { useState, useEffect } from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TaskCard } from '@/components/TaskCard';
import { TaskDrawer } from '@/components/TaskDrawer';
import { AddTaskDialog } from '@/components/AddTaskDialog';
import { getTasks } from '@/actions/tasks';
import { MainLayout } from '@/components/MainLayout';

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const fetchTasks = async () => {
    try {
      const result = await getTasks();
      if (result.success) {
        setTasks(result.tasks.map((task: any) => ({
          ...task,
          due_date: task.due_date ? new Date(task.due_date) : undefined,
          created_at: new Date(task.created_at)
        })));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const groupTasks = (tasks: Task[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const overdue: Task[] = [];
    const todayTasks: Task[] = [];
    const upcoming: Task[] = [];

    tasks.forEach(task => {
      if (task.is_completed) return; // Don't show completed tasks in groups

      if (task.due_date) {
        const dueDate = new Date(task.due_date.getFullYear(), task.due_date.getMonth(), task.due_date.getDate());

        if (dueDate < today) {
          overdue.push(task);
        } else if (dueDate.getTime() === today.getTime()) {
          todayTasks.push(task);
        } else {
          upcoming.push(task);
        }
      } else {
        upcoming.push(task); // Tasks without due date go to upcoming
      }
    });

    return { overdue, today: todayTasks, upcoming };
  };

  const { overdue, today, upcoming } = groupTasks(tasks);

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleRefresh = () => {
    fetchTasks();
  };

  if (loading) {
    return (
      <MainLayout showHeader={true} showSidebar={true}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout showHeader={true} showSidebar={true}>
      <div className="space-y-6 pb-20 md:pb-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Task Manager</h1>
            <p className="text-gray-400">Stay organized with your academic and personal tasks</p>
          </div>
          <Button
            onClick={() => setAddDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus size={16} className="mr-2" />
            Add Task
          </Button>
        </div>

        {/* Task Groups */}
        <div className="space-y-6">
          {/* Overdue Tasks */}
          {overdue.length > 0 && (
            <Card className="bg-red-900/20 border-red-500/50">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center">
                  <CheckSquare size={20} className="mr-2" />
                  Overdue ({overdue.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {overdue.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      onRefresh={handleRefresh}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Today's Tasks */}
          {today.length > 0 && (
            <Card className="bg-green-900/20 border-green-500/50">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center">
                  <CheckSquare size={20} className="mr-2" />
                  Today ({today.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {today.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      onRefresh={handleRefresh}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Tasks */}
          {upcoming.length > 0 && (
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardHeader>
                <CardTitle className="text-gray-300 flex items-center">
                  <CheckSquare size={20} className="mr-2" />
                  Upcoming ({upcoming.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcoming.map(task => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEditTask}
                      onRefresh={handleRefresh}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {overdue.length === 0 && today.length === 0 && upcoming.length === 0 && (
            <Card className="bg-gray-900/50 border-gray-700/50">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold text-white mb-2">No tasks yet!</h3>
                <p className="text-gray-400 mb-6">Create your first task to get started with staying organized.</p>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <Plus size={16} className="mr-2" />
                  Add Your First Task
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Task Drawer */}
        <TaskDrawer
          task={selectedTask}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onRefresh={handleRefresh}
        />

        {/* Add Task Dialog */}
        <AddTaskDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onRefresh={handleRefresh}
        />
      </div>
    </MainLayout>
  );
}