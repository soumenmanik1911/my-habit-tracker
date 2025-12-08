import { NextResponse } from 'next/server';
import sql from '@/db/index';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Security check
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    if (token !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0];

    // Query distinct users who have tasks due today that are not completed, with their onesignal_id
    const usersWithSubscriptions = await sql`
      SELECT DISTINCT t.user_id, us.setting_value as onesignal_id
      FROM tasks t
      JOIN UserSettings us ON t.user_id = us.user_id
      WHERE DATE(t.due_date) = ${today}
        AND t.is_completed = false
        AND us.setting_key = 'onesignal_id'
        AND us.setting_value IS NOT NULL
        AND us.setting_value != ''
    `;

    // Send notifications
    const notificationPromises = usersWithSubscriptions.map(async (row: any) => {
      const onesignalId = row.onesignal_id;

      const response = await fetch('https://api.onesignal.com/notifications', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
          include_subscription_ids: [onesignalId],
          headings: { en: 'Task Reminder' },
          contents: { en: 'You have a task due today!' },
        }),
      });

      if (!response.ok) {
        console.error(`Failed to send notification to ${onesignalId}:`, response.statusText);

        // If the subscription ID is invalid (403 Forbidden or 404 Not Found), remove it from database
        if (response.status === 403 || response.status === 404) {
          try {
            await sql`
              DELETE FROM UserSettings
              WHERE setting_key = 'onesignal_id'
                AND setting_value = ${onesignalId}
            `;
            console.log(`Removed invalid subscription ID: ${onesignalId}`);
          } catch (deleteError) {
            console.error(`Failed to remove invalid subscription ID ${onesignalId}:`, deleteError);
          }
        }
      }

      return response;
    });

    await Promise.all(notificationPromises);

    return NextResponse.json({
      success: true,
      notificationsSent: usersWithSubscriptions.length
    });
  } catch (error) {
    console.error('Error in daily reminder cron:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}