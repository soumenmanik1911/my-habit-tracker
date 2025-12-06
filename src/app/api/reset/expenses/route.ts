import { NextRequest, NextResponse } from 'next/server';
import sql from '@/db/index';

export async function POST(request: NextRequest) {
  try {
    const { beforeDate } = await request.json();

    if (!beforeDate) {
      return NextResponse.json({ error: 'beforeDate is required' }, { status: 400 });
    }

    // Delete expenses before the date
    const result = await sql`
      DELETE FROM Expenses
      WHERE date < ${beforeDate}
    `;

    return NextResponse.json({
      success: true,
      deletedCount: result.length || 0,
      message: `Deleted ${result.length || 0} expense records`
    });
  } catch (error) {
    console.error('Error resetting expenses:', error);
    return NextResponse.json({ error: 'Failed to reset expenses' }, { status: 500 });
  }
}