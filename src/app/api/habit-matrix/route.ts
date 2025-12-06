import { NextResponse } from 'next/server';
import { getHabitMatrixData } from '@/lib/data-fetching';

export async function GET() {
  try {
    const habitData = await getHabitMatrixData();
    return NextResponse.json(habitData);
  } catch (error) {
    console.error('Error fetching habit matrix data:', error);
    
    // Return empty data instead of 500 error to prevent UI crashes
    const fallbackData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      fallbackData.push({
        date: date.toISOString().split('T')[0],
        dsa: false,
        gym: false,
        mood: false,
        college: false,
      });
    }
    
    return NextResponse.json(fallbackData);
  }
}