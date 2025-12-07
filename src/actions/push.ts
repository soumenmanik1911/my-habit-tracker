'use server';

import { auth } from '@clerk/nextjs/server';
import { updateUserSetting } from '@/lib/data-fetching';

export async function saveSubscriptionId(subscriptionId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Unauthorized' };
    }

    if (!subscriptionId || subscriptionId.trim() === '') {
      return { error: 'Subscription ID is required' };
    }

    await updateUserSetting('onesignal_id', subscriptionId.trim(), userId);
    return { success: true };
  } catch (error) {
    console.error('Error saving subscription ID:', error);
    return { error: 'Failed to save subscription ID' };
  }
}