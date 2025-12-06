import { NextResponse } from 'next/server';
import { getYearlyActivity, getUserSettings, getHabitStreaks } from '@/lib/data-fetching';

export async function GET() {
  try {
    // Debug: Check if DATABASE_URL is available
    console.log('DATABASE_URL available:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL value:', process.env.DATABASE_URL?.substring(0, 20) + '...');

    const [activityData, settings, streaks] = await Promise.all([
      getYearlyActivity(),
      getUserSettings(),
      getHabitStreaks(),
    ]);

    return NextResponse.json({
      activity: activityData,
      settings,
      streaks,
    });
  } catch (error) {
    console.error('Error fetching yearly activity:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: 'Failed to fetch yearly activity', details: errorMessage }, { status: 500 });
  }
}