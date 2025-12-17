import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getHabitAnalytics } from '@/lib/data-fetching';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const analytics = await getHabitAnalytics(userId);
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching habit analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch habit analytics' }, { status: 500 });
  }
}