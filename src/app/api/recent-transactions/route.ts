import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getRecentTransactions } from '@/lib/data-fetching';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const transactions = await getRecentTransactions(userId);
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch recent transactions' }, { status: 500 });
  }
}