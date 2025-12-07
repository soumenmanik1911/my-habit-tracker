import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getDSAProblemStats } from '@/lib/data-fetching';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await getDSAProblemStats(userId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching DSA problem stats:', error);
    return NextResponse.json({ error: 'Failed to fetch DSA problem stats' }, { status: 500 });
  }
}