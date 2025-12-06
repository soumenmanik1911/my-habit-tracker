import { NextResponse } from 'next/server';
import sql from '@/db/index';

/**
 * Returns full HealthTracker history ordered by date descending.
 * Kept at /api/health/weekly for backward compatibility,
 * but now serves as a generic history endpoint.
 */
export async function GET() {
  try {
    const history = await sql`
      SELECT * FROM HealthTracker
      ORDER BY date DESC
    `;

    return NextResponse.json(history);
  } catch (error) {
    console.error('Error fetching HealthTracker history:', error);
    return NextResponse.json({ error: 'Failed to fetch health history' }, { status: 500 });
  }
}