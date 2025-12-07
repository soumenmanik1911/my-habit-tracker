'use server';

import { auth } from '@clerk/nextjs/server';
import sql from '@/db/index';

export interface GymAttendanceRecord {
  id?: number;
  date: string;
  attended: boolean;
  workout_type?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export async function updateGymAttendance(date: string, attended: boolean, workoutType?: string, notes?: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    if (!date) {
      return { error: 'Date is required' };
    }

    // Check if record exists for this date
    const existingRecord = await sql`
      SELECT id FROM GymAttendance WHERE date = ${date} AND user_id = ${userId}
    `;

    let result;
    if (existingRecord.length > 0) {
      // Update existing record
      result = await sql`
        UPDATE GymAttendance
        SET
          attended = ${attended},
          workout_type = ${workoutType || null},
          notes = ${notes || null},
          updated_at = CURRENT_TIMESTAMP
        WHERE date = ${date} AND user_id = ${userId}
        RETURNING *
      `;
    } else {
      // Insert new record
      result = await sql`
        INSERT INTO GymAttendance (date, attended, workout_type, notes, user_id)
        VALUES (${date}, ${attended}, ${workoutType || null}, ${notes || null}, ${userId})
        RETURNING *
      `;
    }

    return { success: true, data: result[0] as GymAttendanceRecord };
  } catch (error) {
    console.error('Error updating gym attendance:', error);
    return { error: 'Failed to update gym attendance' };
  }
}

export async function getGymAttendance(date: string): Promise<GymAttendanceRecord | null> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    const record = (await sql`
      SELECT * FROM GymAttendance WHERE date = ${date} AND user_id = ${userId}
    `) as GymAttendanceRecord[];

    return record.length > 0 ? record[0] : null;
  } catch (error) {
    console.error('Error fetching gym attendance:', error);
    return null;
  }
}

export async function getGymAttendanceHistory(days: number = 30): Promise<GymAttendanceRecord[]> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return [];
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const records = (await sql`
      SELECT * FROM GymAttendance
      WHERE date >= ${startDateStr} AND date <= ${endDateStr} AND user_id = ${userId}
      ORDER BY date DESC
    `) as GymAttendanceRecord[];

    return records;
  } catch (error) {
    console.error('Error fetching gym attendance history:', error);
    return [];
  }
}

export async function getGymStats(days: number = 30): Promise<{
  totalDays: number;
  attendedDays: number;
  percentage: number;
  currentStreak: number;
  longestStreak: number;
  thisWeek: number;
}> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        totalDays: 0,
        attendedDays: 0,
        percentage: 0,
        currentStreak: 0,
        longestStreak: 0,
        thisWeek: 0
      };
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    // Get basic stats
    const stats = await sql`
      SELECT
        COUNT(*) as total_days,
        COUNT(CASE WHEN attended = true THEN 1 END) as attended_days
      FROM (
        SELECT generate_series(${startDateStr}::date, ${endDateStr}::date, '1 day') as date
      ) date_series
      LEFT JOIN GymAttendance ga ON ga.date = date_series.date AND ga.user_id = ${userId}
    `;

    const totalDays = stats[0]?.total_days || 0;
    const attendedDays = stats[0]?.attended_days || 0;
    const percentage = totalDays > 0 ? (attendedDays / totalDays) * 100 : 0;

    // Calculate current streak
    const currentStreak = await calculateCurrentGymStreak(userId);

    // Calculate longest streak
    const longestStreak = await calculateLongestGymStreak(userId);

    // Get this week's stats (last 7 days)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    const weekStats = await sql`
      SELECT COUNT(*) as this_week
      FROM GymAttendance
      WHERE date >= ${weekStartStr}
        AND attended = true
        AND user_id = ${userId}
    `;

    const thisWeek = weekStats[0]?.this_week || 0;

    return {
      totalDays,
      attendedDays,
      percentage,
      currentStreak,
      longestStreak,
      thisWeek
    };
  } catch (error) {
    console.error('Error calculating gym stats:', error);
    return {
      totalDays: 0,
      attendedDays: 0,
      percentage: 0,
      currentStreak: 0,
      longestStreak: 0,
      thisWeek: 0
    };
  }
}

async function calculateCurrentGymStreak(userId: string): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Check if today has gym attendance recorded
    const todayRecord = await sql`
      SELECT attended FROM GymAttendance WHERE date = ${today} AND user_id = ${userId}
    `;

    if (todayRecord.length === 0 || !todayRecord[0].attended) {
      // If today is not attended, check if yesterday was attended for a continuous streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const yesterdayRecord = await sql`
        SELECT attended FROM GymAttendance WHERE date = ${yesterdayStr} AND user_id = ${userId}
      `;

      if (yesterdayRecord.length === 0 || !yesterdayRecord[0].attended) {
        return 0;
      }
    }

    // Count consecutive days backwards from today
    let streak = 0;
    let checkDate = new Date();

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];

      const record = await sql`
        SELECT attended FROM GymAttendance WHERE date = ${dateStr} AND user_id = ${userId}
      `;

      if (record.length > 0 && record[0].attended) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  } catch (error) {
    console.error('Error calculating current streak:', error);
    return 0;
  }
}

async function calculateLongestGymStreak(userId: string): Promise<number> {
  try {
    const records = await sql`
      SELECT date, attended
      FROM GymAttendance
      WHERE user_id = ${userId}
      ORDER BY date ASC
    `;

    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;

    for (const record of records) {
      const currentDate = new Date(record.date);

      if (record.attended) {
        if (prevDate) {
          const diffTime = Math.abs(currentDate.getTime() - prevDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            // Continue streak
            currentStreak++;
          } else {
            // Break in streak
            maxStreak = Math.max(maxStreak, currentStreak);
            currentStreak = 1;
          }
        } else {
          // First attended day
          currentStreak = 1;
        }

        prevDate = currentDate;
      }
    }

    // Update max streak with the last current streak
    maxStreak = Math.max(maxStreak, currentStreak);

    return maxStreak;
  } catch (error) {
    console.error('Error calculating longest streak:', error);
    return 0;
  }
}