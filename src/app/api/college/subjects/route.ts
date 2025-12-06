import { NextRequest, NextResponse } from 'next/server';
import sql from '@/db/index';

export async function GET(request: NextRequest) {
  try {
    const subjects = await sql`
      SELECT * FROM Attendance 
      ORDER BY subject_name ASC
    `;

    return NextResponse.json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
  }
}