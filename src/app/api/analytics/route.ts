import { NextRequest, NextResponse } from 'next/server';
import sql from '@/db/index';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const range = parseInt(searchParams.get('range') || '30');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - range);
    
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    // Get streak data
    const dsaStreak = await sql`
      WITH consecutive_days AS (
        SELECT date, 
               ROW_NUMBER() OVER (ORDER BY date DESC) - 
               DENSE_RANK() OVER (ORDER BY date DESC) as group_id
        FROM DSALogs 
        WHERE date <= ${today}
        GROUP BY date
      )
      SELECT COUNT(*) as streak
      FROM (
        SELECT date 
        FROM DSALogs 
        WHERE date = ${today}
        UNION
        SELECT date
        FROM DSALogs 
        WHERE date <= ${today}
          AND date NOT IN (${today})
        ORDER BY date DESC
        LIMIT 1000
      ) recent_problems
    `;

    const gymStreak = await sql`
      -- Calculate consecutive gym streak
      WITH gym_days AS (
        SELECT date,
               ROW_NUMBER() OVER (ORDER BY date) as day_order
        FROM HealthTracker
        WHERE attendance = 'Gym'
        ORDER BY date
      ),
      gaps AS (
        SELECT date,
               day_order,
               day_order - ROW_NUMBER() OVER (ORDER BY date) as gap_group
        FROM gym_days
      ),
      current_streak AS (
        SELECT COUNT(*) as streak
        FROM gaps
        WHERE gap_group = (
          SELECT gap_group
          FROM gaps
          WHERE date = ${today}
        )
        AND date <= ${today}
      )
      SELECT COALESCE((SELECT streak FROM current_streak), 0) as streak
    `;

    const collegeAttendanceStats = await sql`
      SELECT
        COUNT(*) FILTER (WHERE college_attendance = true) as total_present_days,
        COUNT(*) FILTER (WHERE college_attendance = false) as total_absent_days
      FROM HealthTracker
      WHERE college_attendance IS NOT NULL
    `;

    // Multi-dimensional streak tracking
    const streakData = {
      daily: 1, // Current day has activity if any data exists
      weekly: Math.min(7, range),
      monthly: Math.min(30, range),
      dsaStreak: dsaStreak[0]?.streak || 0,
      gymStreak: gymStreak[0]?.streak || 0,
      collegePresentDays: parseInt(collegeAttendanceStats[0]?.total_present_days?.toString() || '0'),
    };

    // Problem analytics with historical data
    const problemAnalytics = await sql`
      SELECT 
        COUNT(*) as total_problems,
        AVG(daily_count) as daily_average
      FROM (
        SELECT date, COUNT(*) as daily_count
        FROM DSALogs 
        WHERE date >= ${startDateStr} AND date <= ${endDateStr}
        GROUP BY date
      ) daily_counts
    `;

    const weeklyProblemData = await sql`
      SELECT date, COUNT(*) as count
      FROM DSALogs 
      WHERE date >= ${startDateStr} AND date <= ${endDateStr}
      GROUP BY date
      ORDER BY date ASC
    `;

    const difficultyBreakdown = await sql`
      SELECT difficulty, COUNT(*) as count
      FROM DSALogs 
      WHERE date >= ${startDateStr} AND date <= ${endDateStr}
        AND difficulty IS NOT NULL
      GROUP BY difficulty
      ORDER BY count DESC
    `;

    const platformBreakdown = await sql`
      SELECT platform, COUNT(*) as count
      FROM DSALogs 
      WHERE date >= ${startDateStr} AND date <= ${endDateStr}
        AND platform IS NOT NULL
      GROUP BY platform
      ORDER BY count DESC
    `;

    // Attendance data with subject-specific analytics
    const subjects = await sql`
      SELECT id, subject_name, total_classes, attended_classes,
             CASE 
               WHEN total_classes = 0 THEN 0 
               ELSE (attended_classes * 100.0 / total_classes) 
             END as percentage
      FROM Attendance 
      ORDER BY subject_name ASC
    `;

    // Calculate attendance streaks per subject
    const attendanceWithStreaks = await Promise.all(
      subjects.map(async (subject) => {
        const subjectStreak = await sql`
          WITH attendance_days AS (
            SELECT date, 
                   CASE WHEN ${subject.id} > 0 THEN true ELSE false END as present
            FROM generate_series(${startDateStr}::date, ${endDateStr}::date, '1 day') as date
          )
          SELECT COUNT(*) as streak
          FROM (
            SELECT date, 
                   CASE WHEN a.total_classes > 0 THEN true ELSE false END as present
            FROM attendance_days ad
            LEFT JOIN Attendance a ON a.id = ${subject.id}
          ) current_streak
          WHERE present = true
          ORDER BY date DESC
          LIMIT 30
        `;
        
        return {
          ...subject,
          streak: subjectStreak[0]?.streak || 0
        };
      })
    );

    // Health metrics
    const healthMetrics = await sql`
      SELECT 
        AVG(sleep_hours) as avg_sleep,
        AVG(mood_score) as avg_mood,
        COUNT(CASE WHEN gym_status = true THEN 1 END) as gym_days
      FROM DailyStats 
      WHERE date >= ${startDateStr} AND date <= ${endDateStr}
        AND (sleep_hours IS NOT NULL OR mood_score IS NOT NULL OR gym_status IS NOT NULL)
    `;

    const weeklyHealthTrends = await sql`
      SELECT date, sleep_hours, mood_score, gym_status
      FROM DailyStats 
      WHERE date >= ${weekAgoStr} AND date <= ${today}
      ORDER BY date DESC
    `;

    const result = {
      streakData: streakData || { daily: 0, weekly: 0, monthly: 0, dsaStreak: 0, gymStreak: 0 },
      problemAnalytics: {
        totalProblems: parseInt(problemAnalytics[0]?.total_problems?.toString() || '0'),
        dailyAverage: parseFloat(Number(problemAnalytics[0]?.daily_average || 0).toFixed(1)),
        weeklyData: weeklyProblemData?.map((item: any) => ({
          date: item.date,
          count: item.count
        })) || [],
        difficultyBreakdown: difficultyBreakdown?.map((item: any) => ({
          difficulty: item.difficulty,
          count: item.count
        })) || [],
        platformBreakdown: platformBreakdown?.map((item: any) => ({
          platform: item.platform,
          count: item.count
        })) || []
      },
      attendanceData: {
        subjects: attendanceWithStreaks?.map((subject: any) => ({
          id: subject.id,
          subject_name: subject.subject_name,
          attended_classes: subject.attended_classes,
          total_classes: subject.total_classes,
          percentage: parseFloat(Number(subject.percentage || 0).toFixed(1)),
          streak: subject.streak || 0
        })) || [],
        weeklyAttendance: weeklyHealthTrends?.map((day: any) => ({
          date: day.date,
          present: day.gym_status || false
        })) || []
      },
      healthMetrics: {
        averageSleep: parseFloat(Number(healthMetrics[0]?.avg_sleep || 0).toFixed(1)),
        averageMood: parseFloat(Number(healthMetrics[0]?.avg_mood || 0).toFixed(1)),
        gymDays: parseInt(healthMetrics[0]?.gym_days?.toString() || '0'),
        weeklyTrends: weeklyHealthTrends?.map((day: any) => ({
          date: day.date,
          sleep: day.sleep_hours || undefined,
          mood: day.mood_score || undefined,
          gym: day.gym_status || false
        })) || []
      }
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
  }
}