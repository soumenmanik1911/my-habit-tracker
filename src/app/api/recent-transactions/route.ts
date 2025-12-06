import { NextResponse } from 'next/server';
import { getRecentTransactions } from '@/lib/data-fetching';

export async function GET() {
  try {
    const transactions = await getRecentTransactions();
    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching recent transactions:', error);
    return NextResponse.json({ error: 'Failed to fetch recent transactions' }, { status: 500 });
  }
}