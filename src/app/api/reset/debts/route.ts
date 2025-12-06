import { NextRequest, NextResponse } from 'next/server';
import sql from '@/db/index';

export async function POST(request: NextRequest) {
  try {
    const { beforeDate } = await request.json();

    if (!beforeDate) {
      return NextResponse.json({ error: 'beforeDate is required' }, { status: 400 });
    }

    // Delete debts before the date
    const result = await sql`
      DELETE FROM Expenses
      WHERE is_debt = true AND date < ${beforeDate}
    `;

    return NextResponse.json({
      success: true,
      deletedCount: result.length || 0,
      message: `Deleted ${result.length || 0} debt records`
    });
  } catch (error) {
    console.error('Error resetting debts:', error);
    return NextResponse.json({ error: 'Failed to reset debts' }, { status: 500 });
  }
}