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
  showSmokingTracker: boolean;
  cigarettePrice: string;
}

export interface HabitStreak {
  habitType: string;
  currentStreak: number;
  longestStreak: number;
  lastUpdated: string;
}

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];

  // Get settings for streak calculations
  const settings = await getUserSettings(userId);

  // Get DSA stats
  const dsaStats = await sql`
    SELECT COUNT(*) as total_solved FROM DSALogs WHERE user_id = ${userId}
  `;

  // Calculate streaks using new functions
  const [dsaStreak, gymStreak, collegeStreak] = await Promise.all([
    calculateDSAStreak(settings, userId),
    calculateGymStreak(settings, userId),
    calculateCollegeStreak(settings, userId),
  ]);

  // Get expense stats
  const expenseStats = await sql`
    SELECT
      COALESCE(SUM(CASE WHEN is_debt = false THEN amount END), 0) as total_expense,
      COALESCE(SUM(CASE WHEN is_debt = true THEN amount END), 0) as total_debt
    FROM Expenses
    WHERE user_id = ${userId}
  `;

  // Get attendance summary
  const attendanceStats = await sql`
    SELECT
      MIN(CASE WHEN total_classes > 0 THEN (attended_classes * 100.0 / total_classes) ELSE 100 END) as lowest_percentage,
      COUNT(CASE WHEN total_classes > 0 AND (attended_classes * 100.0 / total_classes) < 75 THEN 1 END) as subjects_at_risk
    FROM Attendance
    WHERE user_id = ${userId}
  `;

  // Get college attendance stats
  const collegeStats = await sql`
    SELECT
      COUNT(*) FILTER (WHERE college_attendance = true) as total_present_days,
      COUNT(*) FILTER (WHERE college_attendance = false) as total_absent_days,
      COUNT(*) as total_days
    FROM HealthTracker
    WHERE college_attendance IS NOT NULL AND user_id = ${userId}
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


export async function getRecentTransactions(userId: string): Promise<RecentTransaction[]> {
  const transactions = await sql`
    SELECT id, amount, category, description, is_debt, date
    FROM Expenses
    WHERE user_id = ${userId}
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

export async function getExpenseBreakdown(userId: string) {
  const breakdown = await sql`
    SELECT category, SUM(amount) as total
    FROM Expenses
    WHERE is_debt = false AND user_id = ${userId}
    GROUP BY category
    ORDER BY total DESC
  `;

  return breakdown.map((row: any) => ({
    category: row.category,
    total: parseFloat(row.total?.toString()),
  }));
}

export async function getUserSettings(userId: string): Promise<UserSettings> {
  const settings = await sql`
    SELECT setting_key, setting_value
    FROM UserSettings
    WHERE user_id = ${userId}
  `;

  const settingsMap: Record<string, string> = {};
  settings.forEach((row: any) => {
    settingsMap[row.setting_key] = row.setting_value;
  });

  return {
    dsaStreakEnabled: settingsMap.dsa_streak_enabled === 'true',
    gymMissThreshold: parseInt(settingsMap.gym_miss_threshold || '3'),
    collegeStreakEnabled: settingsMap.college_streak_enabled === 'true',
    showSmokingTracker: settingsMap.show_smoking_tracker !== 'false', // Default true
    cigarettePrice: settingsMap.cigarette_price || '6',
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

export async function updateUserSetting(key: string, value: string, userId: string): Promise<void> {
  await sql`
    INSERT INTO UserSettings (user_id, setting_key, setting_value, updated_at)
    VALUES (${userId}, ${key}, ${value}, CURRENT_TIMESTAMP)
    ON CONFLICT (user_id, setting_key)
    DO UPDATE SET setting_value = ${value}, updated_at = CURRENT_TIMESTAMP
  `;
}

export async function updateHabitStreak(habitType: string, currentStreak: number, longestStreak: number): Promise<void> {
  await sql`
    UPDATE HabitStreaks
    SET current_streak = ${currentStreak}, longest_streak = ${longestStreak}, last_updated = CURRENT_DATE, updated_at = CURRENT_TIMESTAMP
    WHERE habit_type = ${habitType}
  `;
}

export async function calculateDSAStreak(settings: UserSettings, userId: string): Promise<number> {
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
    WHERE date <= ${today} AND user_id = ${userId}
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

export async function calculateGymStreak(settings: UserSettings, userId: string): Promise<number> {
  const today = new Date().toISOString().split('T')[0];

  // Get gym activity in chronological order
  const gymData = await sql`
    SELECT date, attendance
    FROM HealthTracker
    WHERE date <= ${today} AND user_id = ${userId}
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

export async function calculateCollegeStreak(settings: UserSettings, userId: string): Promise<number> {
  if (!settings.collegeStreakEnabled) {
    return 0;
  }

  const today = new Date().toISOString().split('T')[0];

  // Get college attendance in chronological order
  const collegeData = await sql`
    SELECT date, college_attendance
    FROM HealthTracker
    WHERE date <= ${today} AND college_attendance IS NOT NULL AND user_id = ${userId}
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


export async function getDSAProblemStats(userId: string) {
  const stats = await sql`
    SELECT difficulty, COUNT(*) as count
    FROM DSALogs
    WHERE user_id = ${userId}
    GROUP BY difficulty
    ORDER BY difficulty
  `;

  return stats.map((row: any) => ({
    difficulty: row.difficulty,
    count: parseInt(row.count?.toString() || '0'),
  }));
}
