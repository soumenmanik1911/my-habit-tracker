import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/db/index';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all pending tasks for the user in one optimized query
    const tasks = await sql`
      SELECT 
        id,
        title,
        description,
        priority,
        due_date,
        is_completed,
        category,
        created_at
      FROM tasks 
      WHERE user_id = ${userId} 
        AND is_completed = false
      ORDER BY 
        CASE priority 
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          WHEN 'Low' THEN 4
        END,
        due_date ASC NULLS LAST,
        created_at DESC
    `;

    return NextResponse.json({ 
      success: true, 
      tasks,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily tasks' }, 
      { status: 500 }
    );
  }
}