import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/db/index';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: 'Date parameter is required' }, { status: 400 });
    }

    const entry = await sql`
      SELECT * FROM HealthTracker WHERE date = ${date} AND user_id = ${userId}
    `;

    return NextResponse.json(entry.length > 0 ? entry[0] : null);
  } catch (error) {
    console.error('Error fetching HealthTracker entry:', error);
    return NextResponse.json({ error: 'Failed to fetch health entry' }, { status: 500 });
  }
}