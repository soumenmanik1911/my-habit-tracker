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

export async function toggleTask(taskId: number, isAITask: boolean = false) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    if (!taskId) {
      return { error: 'Task ID is required' };
    }

    let currentTask;
    if (isAITask) {
      currentTask = await sql`
        SELECT is_completed FROM ai_tasks WHERE id = ${taskId} AND user_id = ${userId}
      `;
    } else {
      currentTask = await sql`
        SELECT is_completed FROM tasks WHERE id = ${taskId} AND user_id = ${userId}
      `;
    }

    if (currentTask.length === 0) {
      return { error: 'Task not found' };
    }

    const newStatus = !currentTask[0].is_completed;

    if (isAITask) {
      await sql`
        UPDATE ai_tasks
        SET is_completed = ${newStatus}
        WHERE id = ${taskId} AND user_id = ${userId}
      `;
    } else {
      await sql`
        UPDATE tasks
        SET is_completed = ${newStatus}
        WHERE id = ${taskId} AND user_id = ${userId}
      `;
    }

    return { success: true };
  } catch (error) {
    console.error('Error toggling task:', error);
    return { error: 'Failed to toggle task' };
  }
}

export async function deleteTask(taskId: number, isAITask: boolean = false) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    if (!taskId) {
      return { error: 'Task ID is required' };
    }

    if (isAITask) {
      await sql`
        DELETE FROM ai_tasks WHERE id = ${taskId} AND user_id = ${userId}
      `;
    } else {
      await sql`
        DELETE FROM tasks WHERE id = ${taskId} AND user_id = ${userId}
      `;
    }

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

    // Fetch regular tasks
    const regularTasks = await sql`
      SELECT * FROM tasks WHERE user_id = ${userId} ORDER BY due_date ASC NULLS LAST, created_at DESC
    `;

    // Fetch AI-generated tasks
    const aiTasks = await sql`
      SELECT * FROM ai_tasks WHERE user_id = ${userId} ORDER BY date ASC, time ASC NULLS LAST, created_at DESC
    `;

    // Normalize AI tasks to match the structure of regular tasks
    const normalizedAITasks = aiTasks.map((task: any) => {
      // Fix logic for combining date and time
      const baseDate = new Date(task.date); // Handle the existing timestamp
      const cleanDateStr = baseDate.toISOString().split('T')[0]; // Get "2025-12-25"
      const timeString = task.time || '00:00';
      let combinedDateTime = new Date(`${cleanDateStr}T${timeString}`);

      // Validate the combined date
      if (isNaN(combinedDateTime.getTime())) {
        console.error('[API_ERROR] Invalid date/time combination:', {
          date: task.date,
          time: task.time,
          taskId: task.id
        });
        // Fallback to date only if combination fails
        combinedDateTime = new Date(`${cleanDateStr}T00:00:00`);
      }

      console.log('[DEBUG] Fixed Date:', combinedDateTime.toISOString());

      return {
        ...task,
        id: task.id, // Keep the original AI task ID
        title: task.title,
        description: task.description || '',
        priority: 'Medium', // Default priority for AI tasks
        due_date: combinedDateTime, // Combined date/time as Date object
        is_completed: task.is_completed || false,
        category: 'Personal', // Default category for AI tasks
        created_at: task.created_at || new Date(),
        source: 'AI', // Source flag to identify AI tasks
        is_ai_task: true, // Legacy flag for backward compatibility
      };
    });

    // Merge both arrays
    const combinedTasks = [...regularTasks, ...normalizedAITasks];

    // Sort by due_date (or date for AI tasks)
    combinedTasks.sort((a: any, b: any) => {
      const dateA = a.due_date || (a.date ? new Date(`${a.date}T${a.time || '00:00:00'}`) : new Date(0));
      const dateB = b.due_date || (b.date ? new Date(`${b.date}T${b.time || '00:00:00'}`) : new Date(0));
      return dateA.getTime() - dateB.getTime();
    });

    console.log('[API] Merged Tasks Count:', combinedTasks.length);
    console.log('[API] Regular Tasks Count:', regularTasks.length);
    console.log('[API] AI Tasks Count:', aiTasks.length);

    return { success: true, tasks: combinedTasks };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { error: 'Failed to fetch tasks' };
  }
}