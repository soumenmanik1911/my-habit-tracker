import { NextRequest, NextResponse } from 'next/server';
import { updateGymAttendance, getGymAttendance } from '@/actions/gym-attendance';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const attendance = await getGymAttendance(date);
    
    return NextResponse.json(attendance);
  } catch (error) {
    console.error('Error fetching gym attendance:', error);
    return NextResponse.json({ error: 'Failed to fetch gym attendance' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, attended, workout_type, notes } = body;

    if (!date || typeof attended !== 'boolean') {
      return NextResponse.json(
        { error: 'Date and attended status are required' }, 
        { status: 400 }
      );
    }

    const result = await updateGymAttendance(date, attended, workout_type, notes);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data: result.data });
  } catch (error) {
    console.error('Error updating gym attendance:', error);
    return NextResponse.json({ error: 'Failed to update gym attendance' }, { status: 500 });
  }
}