import { NextResponse } from 'next/server';
import { getDSAProblemStats } from '@/lib/data-fetching';

export async function GET() {
  try {
    const stats = await getDSAProblemStats();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching DSA problem stats:', error);
    return NextResponse.json({ error: 'Failed to fetch DSA problem stats' }, { status: 500 });
  }
}