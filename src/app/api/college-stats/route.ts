import { NextResponse } from 'next/server';
import { getCollegeAttendanceStats } from '@/actions/health';

export async function GET() {
  try {
    const stats = await getCollegeAttendanceStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching college stats:', error);
    return NextResponse.json({ error: 'Failed to fetch college stats' }, { status: 500 });
  }
}