import { NextResponse } from 'next/server';
import sql from '@/db';
import { auth } from '@clerk/nextjs/server';

// Define the structure for task data
export interface TaskData {
  title: string;
  description?: string;
  date?: string;
  time?: string;
}

// POST endpoint to add a task to the database
export async function POST(request: Request) {
  try {
    const taskData: TaskData = await request.json();
    
    console.log('[API_DEBUG] Received task data:', taskData);
    
    // Validate the task data
    if (!taskData.title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }
    
    // Combine date and time into a single due_date timestamp
    const dueDate = taskData.date && taskData.time
      ? new Date(`${taskData.date}T${taskData.time}:00`)
      : taskData.date
        ? new Date(`${taskData.date}T00:00:00`)
        : undefined;
    
    // Insert the task into the database
    const result = await sql`
      INSERT INTO tasks (user_id, title, description, due_date)
      VALUES ('default_user', ${taskData.title}, ${taskData.description}, ${dueDate})
    `;
    
    console.log('[API_DEBUG] Task added to database:', result);
    
    return NextResponse.json(
      { success: true, task: taskData },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API_DEBUG] Error adding task:', error);
    return NextResponse.json(
      { error: 'Failed to add task' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve all tasks (both regular and AI-generated)
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: true, tasks: [] },
        { status: 200 }
      );
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

    return NextResponse.json(
      { success: true, tasks: combinedTasks },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API_DEBUG] Error retrieving tasks:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve tasks' },
      { status: 500 }
    );
  }
}