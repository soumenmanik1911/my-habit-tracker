import { NextResponse } from 'next/server';
import sql from '@/db/index';

export async function GET() {
  try {
    // Export all data
    const [expenses, healthTracker, dsaLogs] = await Promise.all([
      sql`SELECT * FROM Expenses ORDER BY date DESC`,
      sql`SELECT * FROM HealthTracker ORDER BY date DESC`,
      sql`SELECT * FROM DSALogs ORDER BY date DESC, id DESC`
    ]);

    const exportData = {
      expenses: expenses,
      healthTracker: healthTracker,
      dsaLogs: dsaLogs,
      exportedAt: new Date().toISOString(),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="devlife-data-export.json"'
      }
    });
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}