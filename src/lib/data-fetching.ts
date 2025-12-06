import sql from '@/db/index';

export interface DashboardStats {
  totalSolved: number;
  currentStreak: number;
  gymStreak: number;
  totalExpense: number;
  totalDebt: number;
  attendanceSummary: {
    lowestPercentage: number;
    subjectsAtRisk: number;
  };
  collegeAttendance: {
    totalDays: number;
    presentDays: number;
  };
}

export interface ActivityDay {
  date: string;
  dsaCount: number;
  gymActivity: boolean;
  expenseCount: number;
}

export interface RecentTransaction {
  id: number;
  amount: number;
  category: string;
  description: string;
  is_debt: boolean;
  date: string;
}

export interface UserSettings {
  dsaStreakEnabled: boolean;
  gymMissThreshold: number;
  collegeStreakEnabled: boolean;
}

export interface HabitStreak {
  habitType: string;
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];

  // Get settings for streak calculations
  const settings = await getUserSettings();

  // Get DSA stats
  const dsaStats = await sql`
    SELECT COUNT(*) as total_solved FROM DSALogs
  `;

  // Calculate streaks using new functions
  const [dsaStreak, gymStreak, collegeStreak] = await Promise.all([
    calculateDSAStreak(settings),
    calculateGymStreak(settings),
    calculateCollegeStreak(settings),
  ]);

  // Get expense stats
  const expenseStats = await sql`
    SELECT
      COALESCE(SUM(CASE WHEN is_debt = false THEN amount END), 0) as total_expense,
      COALESCE(SUM(CASE WHEN is_debt = true THEN amount END), 0) as total_debt
    FROM Expenses
  `;

  // Get attendance summary
  const attendanceStats = await sql`
    SELECT
      MIN(CASE WHEN total_classes > 0 THEN (attended_classes * 100.0 / total_classes) ELSE 100 END) as lowest_percentage,
      COUNT(CASE WHEN total_classes > 0 AND (attended_classes * 100.0 / total_classes) < 75 THEN 1 END) as subjects_at_risk
    FROM Attendance
  `;

  // Get college attendance stats
  const collegeStats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE college_attendance = true) as total_present_days,
      COUNT(*) FILTER (WHERE college_attendance = false) as total_absent_days,
      COUNT(*) as total_days
    FROM HealthTracker
    WHERE college_attendance IS NOT NULL
  `;

  return {
    totalSolved: parseInt(dsaStats[0]?.total_solved?.toString() || '0'),
    currentStreak: dsaStreak,
    gymStreak: gymStreak,
    totalExpense: parseFloat(expenseStats[0]?.total_expense?.toString() || '0'),
    totalDebt: parseFloat(expenseStats[0]?.total_debt?.toString() || '0'),
    attendanceSummary: {
      lowestPercentage: parseFloat(attendanceStats[0]?.lowest_percentage?.toString() || '100'),
      subjectsAtRisk: parseInt(attendanceStats[0]?.subjects_at_risk?.toString() || '0'),
    },
    collegeAttendance: {
      totalDays: parseInt(collegeStats[0]?.total_days?.toString() || '0'),
      presentDays: parseInt(collegeStats[0]?.total_present_days?.toString() || '0'),
    },
  };
}

export async function getActivityHistory(): Promise<ActivityDay[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 365);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const activityData = await sql`
    SELECT
      d.date,
      COALESCE(dsa.dsa_count, 0) as dsa_count,
      COALESCE(h.gym_activity, false) as gym_activity,
      COALESCE(e.expense_count, 0) as expense_count
    FROM (
      SELECT generate_series(${startDateStr}::date, ${endDateStr}::date, '1 day'::interval) as date
    ) d
    LEFT JOIN (
      SELECT date, COUNT(*) as dsa_count
      FROM DSALogs
      GROUP BY date
    ) dsa ON d.date = dsa.date
    LEFT JOIN (
      SELECT date, attendance = 'Gym' as gym_activity
      FROM HealthTracker
    ) h ON d.date = h.date
    LEFT JOIN (
      SELECT date, COUNT(*) as expense_count
      FROM Expenses
      GROUP BY date
    ) e ON d.date = e.date
    ORDER BY d.date ASC
  `;

  return activityData.map((row: any) => ({
    date: row.date,
    dsaCount: parseInt(row.dsa_count?.toString() || '0'),
    gymActivity: Boolean(row.gym_activity),
    expenseCount: parseInt(row.expense_count?.toString() || '0'),
  }));
}

export async function getRecentTransactions(): Promise<RecentTransaction[]> {
  const transactions = await sql`
    SELECT id, amount, category, description, is_debt, date
    FROM Expenses
    ORDER BY date DESC, id DESC
    LIMIT 5
  `;

  return transactions.map((row: any) => ({
    id: parseInt(row.id?.toString()),
    amount: parseFloat(row.amount?.toString()),
    category: row.category,
    description: row.description || '',
    is_debt: Boolean(row.is_debt),
    date: row.date,
  }));
}

export async function getExpenseBreakdown() {
  const breakdown = await sql`
    SELECT category, SUM(amount) as total
    FROM Expenses
    WHERE is_debt = false
    GROUP BY category
    ORDER BY total DESC
  `;

  return breakdown.map((row: any) => ({
    category: row.category,
    total: parseFloat(row.total?.toString()),
  }));
}

export async function getUserSettings(): Promise<UserSettings> {
  const settings = await sql`
    SELECT setting_key, setting_value
    FROM UserSettings
  `;

  const settingsMap: Record<string, string> = {};
  settings.forEach((row: any) => {
    settingsMap[row.setting_key] = row.setting_value;
  });

  return {
    dsaStreakEnabled: settingsMap.dsa_streak_enabled === 'true',
    gymMissThreshold: parseInt(settingsMap.gym_miss_threshold || '3'),
    collegeStreakEnabled: settingsMap.college_streak_enabled === 'true',
  };
}

export async function getHabitStreaks(): Promise<HabitStreak[]> {
  const streaks = await sql`
    SELECT habit_type, current_streak, longest_streak, last_updated
    FROM HabitStreaks
  `;

  return streaks.map((row: any) => ({
    habitType: row.habit_type,
    currentStreak: parseInt(row.current_streak?.toString() || '0'),
    longestStreak: parseInt(row.longest_streak?.toString() || '0'),
    lastUpdated: row.last_updated,
  }));
}

export async function updateUserSetting(key: string, value: string): Promise<void> {
  await sql`
    UPDATE UserSettings
    SET setting_value = ${value}, updated_at = CURRENT_TIMESTAMP
    WHERE setting_key = ${key}
  `;
}

export async function updateHabitStreak(habitType: string, currentStreak: number, longestStreak: number): Promise<void> {
  await sql`
    UPDATE HabitStreaks
    SET current_streak = ${currentStreak}, longest_streak = ${longestStreak}, last_updated = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
    WHERE habit_type = ${habitType}
  `;
}

export async function calculateDSAStreak(settings: UserSettings): Promise<number> {
  if (!settings.dsaStreakEnabled) {
    // If streaks are disabled, return total problems solved today or something else
    // For now, return 0 as placeholder
    return 0;
  }

  const today = new Date().toISOString().split('T')[0];

  // Get all dates with DSA activity in chronological order
  const dsaDates = await sql`
    SELECT DISTINCT date
    FROM DSALogs
    WHERE date <= ${today}
    ORDER BY date DESC
  `;

  if (dsaDates.length === 0) return 0;

  let streak = 0;
  const todayDate = new Date(today);

  // Check if today has activity
  const todayHasActivity = dsaDates.some((row: any) => row.date === today);
  if (!todayHasActivity) return 0;

  // Count consecutive days with activity
  for (let i = 0; i < dsaDates.length; i++) {
    const dateStr = dsaDates[i].date;
    const date = new Date(dateStr);
    const expectedDate = new Date(todayDate);
    expectedDate.setDate(todayDate.getDate() - streak);

    if (dateStr === expectedDate.toISOString().split('T')[0]) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function calculateGymStreak(settings: UserSettings): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  // Get gym activity in chronological order
  const gymData = await sql`
    SELECT date, attendance
    FROM HealthTracker
    WHERE date <= ${today}
    ORDER BY date DESC
  `;

  if (gymData.length === 0) return 0;

  let streak = 0;
  let consecutiveMisses = 0;
  const missThreshold = settings.gymMissThreshold;

  for (let i = 0; i < gymData.length; i++) {
    const row = gymData[i];
    const isGymDay = row.attendance === 'Gym' || row.attendance === 'Rest Day';

    if (isGymDay) {
      streak++;
      consecutiveMisses = 0;
    } else {
      consecutiveMisses++;
      if (consecutiveMisses >= missThreshold) {
        break;
      }
    }
  }

  return streak;
}

export async function calculateCollegeStreak(settings: UserSettings): Promise<number> {
  if (!settings.collegeStreakEnabled) {
    return 0;
  }

  const today = new Date().toISOString().split('T')[0];

  // Get college attendance in chronological order
  const collegeData = await sql`
    SELECT date, college_attendance
    FROM HealthTracker
    WHERE date <= ${today} AND college_attendance IS NOT NULL
    ORDER BY date DESC
  `;

  if (collegeData.length === 0) return 0;

  let streak = 0;

  for (let i = 0; i < collegeData.length; i++) {
    const row = collegeData[i];
    if (row.college_attendance === true) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function getYearlyActivity(): Promise<Record<string, { dsa: number; gym: boolean; college: boolean }>> {
  // Calculate the date 365 days ago
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 364); // 365 days including today

  // Format dates as YYYY-MM-DD
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Raw SQL query to fetch DSA problems solved per date
  // This aggregates the count of problems solved for each date in the last year
  const dsaData = await sql`
    SELECT
      date,
      COUNT(*) as dsa_count
    FROM DSALogs
    WHERE date BETWEEN ${startDateStr} AND ${endDateStr}
    GROUP BY date
    ORDER BY date ASC
  `;

  // Raw SQL query to fetch gym and college attendance
  const activityData = await sql`
    SELECT
      date,
      attendance = 'Gym' as gym_done,
      college_attendance
    FROM HealthTracker
    WHERE date BETWEEN ${startDateStr} AND ${endDateStr}
    ORDER BY date ASC
  `;

  // Merge the data into a Map for easy lookup
  const activityMap: Record<string, { dsa: number; gym: boolean; college: boolean }> = {};

  // Initialize all dates in the range with default values (safer loop)
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    activityMap[dateStr] = { dsa: 0, gym: false, college: false };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Populate DSA counts with safety check
  dsaData.forEach((row: any) => {
    const dateStr = row.date;
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = { dsa: 0, gym: false, college: false };
    }
    activityMap[dateStr].dsa = parseInt(row.dsa_count?.toString() || '0');
  });

  // Populate gym and college attendance with safety check
  activityData.forEach((row: any) => {
    const dateStr = row.date;
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = { dsa: 0, gym: false, college: false };
    }
    activityMap[dateStr].gym = Boolean(row.gym_done);
    activityMap[dateStr].college = Boolean(row.college_attendance);
  });

  return activityMap;
}

export async function getHabitMatrixData() {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6); // Last 7 days

    // Use local date format to avoid timezone issues
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const matrixData = await sql`
      SELECT
        d.date,
        COALESCE(dsa.dsa_count > 0, false) as dsa_done,
        COALESCE(h.attendance = 'Gym', false) as gym_done,
        COALESCE(h.mood >= 4, false) as good_mood,
        COALESCE(h.college_attendance = true, false) as college_done
      FROM (
        SELECT generate_series(${startDateStr}::date, ${endDateStr}::date, '1 day'::interval) as date
      ) d
      LEFT JOIN (
        SELECT date, COUNT(*) as dsa_count
        FROM DSALogs
        GROUP BY date
      ) dsa ON d.date = dsa.date
      LEFT JOIN HealthTracker h ON d.date = h.date
      ORDER BY d.date ASC
    `;

    return matrixData.map((row: any) => ({
      date: row.date,
      dsa: Boolean(row.dsa_done),
      gym: Boolean(row.gym_done),
      mood: Boolean(row.good_mood),
      college: Boolean(row.college_done),
    }));
  } catch (error) {
    console.error('Error in getHabitMatrixData:', error);

    // Return empty data for the last 7 days instead of throwing
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 6);

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toISOString().split('T')[0],
        dsa: false,
        gym: false,
        mood: false,
        college: false,
      });
    }

    return days;
  }
}