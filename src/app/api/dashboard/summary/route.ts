import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import sql from '@/db/index';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get today's DSA problems count
    const dsaProblemsToday = await sql`
      SELECT COUNT(*) as count FROM DSALogs WHERE date = ${today} AND user_id = ${userId}
    `;

    // Get lowest attendance subject
    const lowestAttendance = await sql`
      SELECT subject_name as subject,
             CASE
               WHEN total_classes = 0 THEN 0
               ELSE (attended_classes * 100.0 / total_classes)
             END as percentage
      FROM Attendance
      WHERE user_id = ${userId}
      ORDER BY percentage ASC
      LIMIT 1
    `;

    // Get total expenses this month
    const totalExpenses = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM Expenses
      WHERE date >= ${currentMonth + '-01'} AND is_debt = false AND user_id = ${userId}
    `;

    // Get total debts
    const totalDebts = await sql`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM Expenses
      WHERE is_debt = true AND user_id = ${userId}
    `;

    // Get gym streak (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const gymActivity = await sql`
      SELECT date, gym_status FROM DailyStats
      WHERE date >= ${thirtyDaysAgoStr} AND user_id = ${userId}
      ORDER BY date DESC
    `;

    // Calculate gym streak
    let gymStreak = 0;
    for (let i = 0; i < gymActivity.length; i++) {
      if (gymActivity[i].gym_status) {
        gymStreak++;
      } else {
        break;
      }
    }

    // Calculate average sleep and mood from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    const weeklyStats = await sql`
      SELECT sleep_hours, mood_score
      FROM DailyStats
      WHERE date >= ${sevenDaysAgoStr} AND user_id = ${userId}
    `;

    const avgSleep = weeklyStats.length > 0
      ? weeklyStats.reduce((sum, stat) => sum + (stat.sleep_hours || 0), 0) / weeklyStats.length
      : 0;

    const avgMood = weeklyStats.length > 0
      ? weeklyStats.filter(stat => stat.mood_score).reduce((sum, stat) => sum + stat.mood_score, 0) /
        weeklyStats.filter(stat => stat.mood_score).length
      : 0;

    // Get DSA activity for last 30 days (for heatmap)
    const dsaActivity = await sql`
      SELECT date, COUNT(*) as count
      FROM DSALogs
      WHERE date >= ${thirtyDaysAgoStr} AND user_id = ${userId}
      GROUP BY date
    `;

    // Get gym activity for last 30 days (for heatmap)
    const gymActivityForHeatmap = await sql`
      SELECT date,
             CASE WHEN gym_status THEN 1 ELSE 0 END as count
      FROM DailyStats
      WHERE date >= ${thirtyDaysAgoStr} AND user_id = ${userId}
    `;

    const result = {
      dsaProblemsToday: dsaProblemsToday[0]?.count || 0,
      lowestAttendance: lowestAttendance.length > 0 ? lowestAttendance[0] : null,
      totalExpensesThisMonth: parseFloat(totalExpenses[0]?.total || '0'),
      totalDebts: parseFloat(totalDebts[0]?.total || '0'),
      gymStreak,
      averageSleep: parseFloat(avgSleep.toFixed(1)),
      averageMood: parseFloat(avgMood.toFixed(1)),
      dsaActivity: dsaActivity.map(item => ({
        date: item.date,
        count: item.count
      })),
      gymActivity: gymActivityForHeatmap.map(item => ({
        date: item.date,
        count: item.count
      }))
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}