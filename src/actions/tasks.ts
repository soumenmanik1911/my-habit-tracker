'use server';

import { auth } from '@clerk/nextjs/server';
import sql from '@/db/index';

export async function createTask(data: {
  title: string;
  description?: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  due_date?: Date;
  category: 'Academic' | 'Personal' | 'Exam' | 'Project';
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    if (!data.title || data.title.trim() === '') {
      return { error: 'Title is required' };
    }

    const result = await sql`
      INSERT INTO tasks (title, description, priority, due_date, category, user_id)
      VALUES (${data.title.trim()}, ${data.description || null}, ${data.priority}, ${data.due_date || null}, ${data.category}, ${userId})
      RETURNING *
    `;

    return { success: true, task: result[0] };
  } catch (error) {
    console.error('Error creating task:', error);
    return { error: 'Failed to create task' };
  }
}

export async function toggleTask(taskId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    if (!taskId) {
      return { error: 'Task ID is required' };
    }

    const currentTask = await sql`
      SELECT is_completed FROM tasks WHERE id = ${taskId} AND user_id = ${userId}
    `;

    if (currentTask.length === 0) {
      return { error: 'Task not found' };
    }

    const newStatus = !currentTask[0].is_completed;

    await sql`
      UPDATE tasks
      SET is_completed = ${newStatus}
      WHERE id = ${taskId} AND user_id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error toggling task:', error);
    return { error: 'Failed to toggle task' };
  }
}

export async function deleteTask(taskId: number) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    if (!taskId) {
      return { error: 'Task ID is required' };
    }

    await sql`
      DELETE FROM tasks WHERE id = ${taskId} AND user_id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { error: 'Failed to delete task' };
  }
}

export async function updateTaskNotes(taskId: number, description: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    if (!taskId) {
      return { error: 'Task ID is required' };
    }

    await sql`
      UPDATE tasks
      SET description = ${description}
      WHERE id = ${taskId} AND user_id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error updating task notes:', error);
    return { error: 'Failed to update task notes' };
  }
}

export async function updateTaskDetails(taskId: number, data: {
  title?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High' | 'Critical';
  due_date?: Date | null;
  category?: 'Academic' | 'Personal' | 'Exam' | 'Project';
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    if (!taskId) {
      return { error: 'Task ID is required' };
    }

    // Use conditional updates since dynamic queries are complex with template literals
    if (data.title !== undefined) {
      await sql`
        UPDATE tasks SET title = ${data.title.trim()} WHERE id = ${taskId} AND user_id = ${userId}
      `;
    }
    if (data.description !== undefined) {
      await sql`
        UPDATE tasks SET description = ${data.description} WHERE id = ${taskId} AND user_id = ${userId}
      `;
    }
    if (data.priority !== undefined) {
      await sql`
        UPDATE tasks SET priority = ${data.priority} WHERE id = ${taskId} AND user_id = ${userId}
      `;
    }
    if (data.due_date !== undefined) {
      await sql`
        UPDATE tasks SET due_date = ${data.due_date} WHERE id = ${taskId} AND user_id = ${userId}
      `;
    }
    if (data.category !== undefined) {
      await sql`
        UPDATE tasks SET category = ${data.category} WHERE id = ${taskId} AND user_id = ${userId}
      `;
    }

    return { success: true };
  } catch (error) {
    console.error('Error updating task details:', error);
    return { error: 'Failed to update task details' };
  }
}

export async function getTasks() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { success: true, tasks: [] };
    }

    const tasks = await sql`
      SELECT * FROM tasks WHERE user_id = ${userId} ORDER BY due_date ASC NULLS LAST, created_at DESC
    `;

    return { success: true, tasks };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { error: 'Failed to fetch tasks' };
  }
}