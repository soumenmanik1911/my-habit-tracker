import { NextResponse } from 'next/server';
import { getExpenseBreakdown } from '@/lib/data-fetching';

export async function GET() {
  try {
    const breakdown = await getExpenseBreakdown();
    return NextResponse.json(breakdown);
  } catch (error) {
    console.error('Error fetching expense breakdown:', error);
    return NextResponse.json({ error: 'Failed to fetch expense breakdown' }, { status: 500 });
  }
}