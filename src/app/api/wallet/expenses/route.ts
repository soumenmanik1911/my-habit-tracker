import { NextRequest, NextResponse } from 'next/server';
import sql from '@/db/index';

export async function GET(request: NextRequest) {
  try {
    // Get current month expenses
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
    
    const expenses = await sql`
      SELECT * FROM Expenses 
      WHERE date >= ${currentMonth + '-01'}
      ORDER BY date DESC, id DESC
    `;

    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}