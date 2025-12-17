import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { toggleHabitLog } from '@/lib/data-fetching';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { habitId, date, completed } = await request.json();
    if (!habitId || !date || completed === undefined) {
      return NextResponse.json({ error: 'habitId, date, and completed are required' }, { status: 400 });
    }

    await toggleHabitLog(userId, habitId, date, completed);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error toggling habit log:', error);
    return NextResponse.json({ error: 'Failed to toggle habit completion' }, { status: 500 });
  }
}