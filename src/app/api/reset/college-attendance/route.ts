import { NextRequest, NextResponse } from 'next/server';
import sql from '@/db/index';

export async function POST(request: NextRequest) {
  try {
    const { beforeDate } = await request.json();

    if (!beforeDate) {
      return NextResponse.json({ error: 'beforeDate is required' }, { status: 400 });
    }

    // Reset college attendance before the date
    const result = await sql`
      UPDATE HealthTracker
      SET college_attendance = NULL
      WHERE date < ${beforeDate} AND college_attendance IS NOT NULL
    `;

    return NextResponse.json({
      success: true,
      updatedCount: result.length || 0,
      message: `Reset ${result.length || 0} college attendance records`
    });
  } catch (error) {
    console.error('Error resetting college attendance:', error);
    return NextResponse.json({ error: 'Failed to reset college attendance' }, { status: 500 });
  }
}