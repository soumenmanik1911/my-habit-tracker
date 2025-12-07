import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/db/index';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current month expenses
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

    const expenses = await sql`
      SELECT * FROM Expenses
      WHERE date >= ${currentMonth + '-01'} AND user_id = ${userId}
      ORDER BY date DESC, id DESC
    `;

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}