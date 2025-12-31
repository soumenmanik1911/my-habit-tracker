import { NextResponse } from 'next/server';
import sql from '@/db';
import { auth } from '@clerk/nextjs/server';

// Define the structure for AI task data
export interface AITaskData {
  title: string;
  date: string;
  time?: string;
}

// POST endpoint to add an AI-generated task to the database
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const aiTaskData: AITaskData = await request.json();

    // Validate the AI task data with enhanced date validation
    if (!aiTaskData.title) {
      return NextResponse.json(
        { error: 'Task title is required' },
        { status: 400 }
      );
    }

    if (!aiTaskData.date) {
      return NextResponse.json(
        { error: 'Date is required for scheduling. Please specify when this task should be completed.' },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(aiTaskData.date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Please use YYYY-MM-DD format (e.g., 2025-12-26)' },
        { status: 400 }
      );
    }

    // Validate that the date is valid and not in the past (optional but recommended)
    const taskDate = new Date(aiTaskData.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isNaN(taskDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date value. Please provide a valid date.' },
        { status: 400 }
      );
    }

    // Optional: Warn about past dates but still allow them
    if (taskDate < today) {
      console.warn('[API_DEBUG] Task scheduled for past date:', aiTaskData.date);
    }

    // Validate time format if provided (HH:MM)
    if (aiTaskData.time && !/^\d{2}:\d{2}$/.test(aiTaskData.time)) {
      return NextResponse.json(
        { error: 'Invalid time format. Please use HH:MM format (e.g., 14:30) or leave empty' },
        { status: 400 }
      );
    }

    // Insert the AI task into the database
    const result = await sql`
      INSERT INTO ai_tasks (user_id, title, date, time)
      VALUES (${userId}, ${aiTaskData.title}, ${aiTaskData.date}, ${aiTaskData.time || null})
      RETURNING *
    `;

    console.log('[API_DEBUG] AI Task added to database:', result);

    return NextResponse.json(
      { success: true, task: result[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('[API_DEBUG] Error adding AI task:', error);
    return NextResponse.json(
      { error: 'Failed to add AI task. Please check your input and try again.' },
      { status: 500 }
    );
  }
}