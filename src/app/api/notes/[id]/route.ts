import { NextRequest, NextResponse } from 'next/server';
import sql from '@/db/index';
import { auth } from '@clerk/nextjs/server';

// GET /api/notes/[id] - Get a specific note
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const notes = await sql`
      SELECT * FROM notes WHERE id = ${id} AND user_id = ${userId}
    `;

    if (notes.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(notes[0]);
  } catch (error) {
    console.error('Error fetching note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/notes/[id] - Update a note
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { title, content, tags, isPinned } = await request.json();

    // Check if note exists and belongs to user
    const existingNotes = await sql`
      SELECT * FROM notes WHERE id = ${id} AND user_id = ${userId}
    `;

    if (existingNotes.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Build update query dynamically using template literals
    let query = sql`UPDATE notes SET `;
    const values = [];
    let hasUpdates = false;

    if (title !== undefined) {
      query = sql`${query} title = ${title}`;
      values.push(title);
      hasUpdates = true;
    }

    if (content !== undefined) {
      query = hasUpdates ? sql`${query}, content = ${content}` : sql`${query} content = ${content}`;
      values.push(content);
      hasUpdates = true;
    }

    if (tags !== undefined) {
      query = hasUpdates ? sql`${query}, tags = ${tags}` : sql`${query} tags = ${tags}`;
      values.push(tags);
      hasUpdates = true;
    }

    if (isPinned !== undefined) {
      query = hasUpdates ? sql`${query}, is_pinned = ${isPinned}` : sql`${query} is_pinned = ${isPinned}`;
      values.push(isPinned);
      hasUpdates = true;
    }

    if (!hasUpdates) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    query = sql`${query}, updated_at = CURRENT_TIMESTAMP WHERE id = ${id} AND user_id = ${userId} RETURNING *`;
    values.push(id, userId);

    const result = await query;

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notes/[id] - Delete a note
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if note exists and belongs to user
    const existingNotes = await sql`
      SELECT * FROM notes WHERE id = ${id} AND user_id = ${userId}
    `;

    if (existingNotes.length === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Delete the note
    await sql`
      DELETE FROM notes WHERE id = ${id} AND user_id = ${userId}
    `;

    return NextResponse.json({ success: true, message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}