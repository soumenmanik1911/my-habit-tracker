import { NextRequest, NextResponse } from 'next/server';
import sql from '@/db/index';

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const problems = await sql`
      SELECT * FROM DSALogs 
      WHERE date = ${today}
      ORDER BY date DESC, time_taken_mins DESC
    `;

    return NextResponse.json(problems);
  } catch (error) {
    console.error('Error fetching today\'s problems:', error);
    return NextResponse.json({ error: 'Failed to fetch problems' }, { status: 500 });
  }
}