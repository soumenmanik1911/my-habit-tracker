import { NextResponse } from 'next/server';
import { getActivityHistory } from '@/lib/data-fetching';

export async function GET() {
  try {
    const activityData = await getActivityHistory();
    return NextResponse.json(activityData);
  } catch (error) {
    console.error('Error fetching activity history:', error);
    return NextResponse.json({ error: 'Failed to fetch activity history' }, { status: 500 });
  }
}