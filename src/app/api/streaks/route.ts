import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getUserSettings, calculateDSAStreak, calculateGymStreak, calculateCollegeStreak } from '@/lib/data-fetching';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const settings = await getUserSettings(userId);

    // Calculate current streaks dynamically
    const [dsaStreak, gymStreak, collegeStreak] = await Promise.all([
      calculateDSAStreak(settings, userId),
      calculateGymStreak(settings, userId),
      calculateCollegeStreak(settings, userId),
    ]);

    // Return calculated streaks in the expected format
    const streaks = [
      {
        habitType: 'dsa',
        currentStreak: dsaStreak,
        longestStreak: dsaStreak, // For now, using current as longest
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      {
        habitType: 'gym',
        currentStreak: gymStreak,
        longestStreak: gymStreak,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
      {
        habitType: 'college',
        currentStreak: collegeStreak,
        longestStreak: collegeStreak,
        lastUpdated: new Date().toISOString().split('T')[0],
      },
    ];

    return NextResponse.json(streaks);
  } catch (error) {
    console.error('Error calculating streaks:', error);
    return NextResponse.json({ error: 'Failed to calculate streaks' }, { status: 500 });
  }
}
