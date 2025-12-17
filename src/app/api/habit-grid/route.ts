import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getHabits, createHabit, updateHabit, deleteHabit } from '@/lib/data-fetching';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const habits = await getHabits(userId);
    return NextResponse.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json({ error: 'Failed to fetch habits' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, goal, icon, color } = await request.json();
    if (!name || !goal) {
      return NextResponse.json({ error: 'Name and goal are required' }, { status: 400 });
    }

    const habit = await createHabit(userId, name, goal, icon || 'Target', color || '#10b981');
    return NextResponse.json(habit);
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json({ error: 'Failed to create habit' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, name, goal, icon, color } = await request.json();
    if (!id || !name || !goal) {
      return NextResponse.json({ error: 'ID, name and goal are required' }, { status: 400 });
    }

    await updateHabit(userId, id, name, goal, icon || 'Target', color || '#10b981');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json({ error: 'Failed to update habit' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await deleteHabit(userId, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json({ error: 'Failed to delete habit' }, { status: 500 });
  }
}