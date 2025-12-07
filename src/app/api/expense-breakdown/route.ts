import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getExpenseBreakdown } from '@/lib/data-fetching';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const breakdown = await getExpenseBreakdown(userId);
    return NextResponse.json(breakdown);
  } catch (error) {
    console.error('Error fetching expense breakdown:', error);
    return NextResponse.json({ error: 'Failed to fetch expense breakdown' }, { status: 500 });
  }
}