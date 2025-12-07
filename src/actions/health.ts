'use server';

import { auth } from '@clerk/nextjs/server';
import sql from '@/db/index';

export type HealthAttendance = 'Gym' | 'Rest Day' | 'Not Going to the Gym';

export interface HealthTrackerRecord {
  id?: number;
  date: string;
  attendance: HealthAttendance;
  mood: number;
  college_attendance?: boolean | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Upsert a single HealthTracker record for a given date.
 * Enforces:
 * - exactly one record per date (ON CONFLICT (date) DO UPDATE)
 * - required attendance (Gym | Rest Day | Not Going to the Gym)
 * - required mood in [1, 5]
 */
export async function updateHealthTrackerEntry(formData: FormData) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const date = formData.get('date') as string;
    const attendance = formData.get('attendance') as string;
    const moodRaw = formData.get('mood') as string;
    const collegeAttendanceRaw = formData.get('college_attendance');

    if (!date) {
      return { error: 'Date is required' };
    }

    if (!attendance) {
      return { error: 'Attendance is required' };
    }

    const allowedAttendance: HealthAttendance[] = [
      'Gym',
      'Rest Day',
      'Not Going to the Gym',
    ];

    if (!allowedAttendance.includes(attendance as HealthAttendance)) {
      return { error: 'Invalid attendance value' };
    }

    const mood = parseInt(moodRaw, 10);
    if (Number.isNaN(mood) || mood < 1 || mood > 5) {
      return { error: 'Mood must be a number between 1 and 5' };
    }

    const collegeAttendance = collegeAttendanceRaw === null ? null : collegeAttendanceRaw === 'true';

    await sql`
      INSERT INTO HealthTracker (date, attendance, mood, college_attendance, user_id)
      VALUES (${date}, ${attendance}, ${mood}, ${collegeAttendance}, ${userId})
      ON CONFLICT (date, user_id) DO UPDATE
      SET attendance = EXCLUDED.attendance,
          mood = EXCLUDED.mood,
          college_attendance = EXCLUDED.college_attendance,
          updated_at = CURRENT_TIMESTAMP
    `;

    return { success: true };
  } catch (error) {
    console.error('Error updating HealthTracker entry:', error);
    return { error: 'Failed to update health entry' };
  }
}

/**
 * Fetch a single HealthTracker record by date.
 */
export async function getHealthTrackerEntry(date: string): Promise<HealthTrackerRecord | null> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return null;
    }

    const stats = await sql`
      SELECT * FROM HealthTracker WHERE date = ${date} AND user_id = ${userId}
    `;

    return stats.length > 0 ? (stats[0] as HealthTrackerRecord) : null;
  } catch (error) {
    console.error('Error fetching HealthTracker entry:', error);
    return null;
  }
}

/**
 * Update college attendance for a specific date.
 */
export async function updateCollegeAttendance(date: string, attended: boolean) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await sql`
      INSERT INTO HealthTracker (date, attendance, mood, college_attendance, user_id)
      VALUES (${date}, 'Rest Day', 3, ${attended}, ${userId})
      ON CONFLICT (date, user_id) DO UPDATE
      SET college_attendance = EXCLUDED.college_attendance,
          updated_at = CURRENT_TIMESTAMP
    `;

    return { success: true };
  } catch (error) {
    console.error('Error updating college attendance:', error);
    return { error: 'Failed to update college attendance' };
  }
}

/**
 * Reset college attendance counter (set all college_attendance to false).
 */
export async function resetCollegeAttendance() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await sql`
      UPDATE HealthTracker
      SET college_attendance = false
      WHERE college_attendance = true AND user_id = ${userId}
    `;

    return { success: true };
  } catch (error) {
    console.error('Error resetting college attendance:', error);
    return { error: 'Failed to reset college attendance' };
  }
}

/**
 * Get college attendance statistics.
 */
export async function getCollegeAttendanceStats() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { totalPresentDays: 0, totalAbsentDays: 0 };
    }

    const stats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE college_attendance = true) as total_present_days,
        COUNT(*) FILTER (WHERE college_attendance = false) as total_absent_days
      FROM HealthTracker
      WHERE college_attendance IS NOT NULL AND user_id = ${userId}
    `;

    return {
      totalPresentDays: parseInt(stats[0]?.total_present_days?.toString() || '0'),
      totalAbsentDays: parseInt(stats[0]?.total_absent_days?.toString() || '0'),
    };
  } catch (error) {
    console.error('Error fetching college attendance stats:', error);
    return { totalPresentDays: 0, totalAbsentDays: 0 };
  }
}

/**
 * Fetch the full HealthTracker history ordered by date descending.
 */
export async function getHealthHistory(): Promise<HealthTrackerRecord[]> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return [];
    }

    const records = await sql`
      SELECT * FROM HealthTracker
      WHERE user_id = ${userId}
      ORDER BY date DESC
    `;

    return records as HealthTrackerRecord[];
  } catch (error) {
    console.error('Error fetching HealthTracker history:', error);
    return [];
  }
}