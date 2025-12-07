'use server';

import { auth } from '@clerk/nextjs/server';
import sql from '@/db/index';

export async function logCigarette() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    const today = new Date().toISOString().split('T')[0];

    // Get cigarette price from settings
    const priceResult = await sql`
      SELECT setting_value FROM UserSettings
      WHERE user_id = ${userId} AND setting_key = 'cigarette_price'
    `;

    const cigarettePrice = parseFloat(priceResult[0]?.setting_value || '6');

    // Check if today's log exists
    const existingLog = await sql`
      SELECT id, count, total_cost FROM SmokingLogs
      WHERE user_id = ${userId} AND date = ${today}
    `;

    if (existingLog.length > 0) {
      // Update existing log
      const newCount = existingLog[0].count + 1;
      const newCost = parseFloat(existingLog[0].total_cost) + cigarettePrice;

      await sql`
        UPDATE SmokingLogs
        SET count = ${newCount}, total_cost = ${newCost}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${existingLog[0].id}
      `;
    } else {
      // Create new log
      await sql`
        INSERT INTO SmokingLogs (user_id, date, count, total_cost)
        VALUES (${userId}, ${today}, 1, ${cigarettePrice})
      `;
    }

    return { success: true };
  } catch (error) {
    console.error('Error logging cigarette:', error);
    return { error: 'Failed to log cigarette' };
  }
}

export async function getSmokingStats() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    // Get visibility setting
    const visibilityResult = await sql`
      SELECT setting_value FROM UserSettings
      WHERE user_id = ${userId} AND setting_key = 'show_smoking_tracker'
    `;

    const isVisible = visibilityResult[0]?.setting_value !== 'false';

    // Get total stats
    const totalStats = await sql`
      SELECT
        COALESCE(SUM(count), 0) as total_count,
        COALESCE(SUM(total_cost), 0) as total_wasted
      FROM SmokingLogs
      WHERE user_id = ${userId}
    `;

    // Calculate current streak (days without smoking)
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check if smoked today
    const todayLog = await sql`
      SELECT count FROM SmokingLogs
      WHERE user_id = ${userId} AND date = ${today}
    `;

    let currentStreak = 0;
    if (todayLog.length === 0) {
      // No smoking today, calculate streak
      const lastSmokeDate = await sql`
        SELECT date FROM SmokingLogs
        WHERE user_id = ${userId}
        ORDER BY date DESC
        LIMIT 1
      `;

      if (lastSmokeDate.length > 0) {
        const lastDate = new Date(lastSmokeDate[0].date);
        const todayDate = new Date(today);
        const diffTime = todayDate.getTime() - lastDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        currentStreak = diffDays - 1; // Days since last smoke
      } else {
        // Never smoked, streak is infinite? But let's set to 0 for now
        currentStreak = 0;
      }
    }

    // Get today's count
    const todayCountResult = await sql`
      SELECT count FROM SmokingLogs
      WHERE user_id = ${userId} AND date = ${today}
    `;

    const todayCount = parseInt(todayCountResult[0]?.count?.toString() || '0');

    return {
      totalWasted: parseFloat(totalStats[0]?.total_wasted?.toString() || '0'),
      totalCount: parseInt(totalStats[0]?.total_count?.toString() || '0'),
      currentStreak: Math.max(0, currentStreak),
      isVisible,
      todayCount
    };
  } catch (error) {
    console.error('Error getting smoking stats:', error);
    return { error: 'Failed to get smoking stats' };
  }
}

export async function toggleSmokingVisibility(isVisible: boolean) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    await sql`
      INSERT INTO UserSettings (user_id, setting_key, setting_value, updated_at)
      VALUES (${userId}, 'show_smoking_tracker', ${isVisible.toString()}, CURRENT_TIMESTAMP)
      ON CONFLICT (user_id, setting_key)
      DO UPDATE SET setting_value = ${isVisible.toString()}, updated_at = CURRENT_TIMESTAMP
    `;

    return { success: true };
  } catch (error) {
    console.error('Error toggling smoking visibility:', error);
    return { error: 'Failed to update visibility' };
  }
}