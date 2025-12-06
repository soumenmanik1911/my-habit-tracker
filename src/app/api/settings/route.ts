import { NextResponse } from 'next/server';
import { getUserSettings, updateUserSetting } from '@/lib/data-fetching';

export async function GET() {
  try {
    const settings = await getUserSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { key, value } = await request.json();
    await updateUserSetting(key, value.toString());
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
  }
}