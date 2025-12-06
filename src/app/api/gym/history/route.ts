import { NextRequest, NextResponse } from 'next/server';
import { getGymAttendanceHistory } from '@/actions/gym-attendance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' }, 
        { status: 400 }
      );
    }

    const history = await getGymAttendanceHistory(days);
    
    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching gym attendance history:', error);
    return NextResponse.json({ error: 'Failed to fetch gym attendance history' }, { status: 500 });
  }
}