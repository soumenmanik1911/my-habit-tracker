import { NextResponse } from 'next/server';
import { getUserSettings, calculateDSAStreak, calculateGymStreak, calculateCollegeStreak } from '@/lib/data-fetching';

export async function GET() {
  try {
    const settings = await getUserSettings();

    // Calculate current streaks dynamically
    const [dsaStreak, gymStreak, collegeStreak] = await Promise.all([
      calculateDSAStreak(settings),
      calculateGymStreak(settings),
      calculateCollegeStreak(settings),
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
