import { NextRequest, NextResponse } from 'next/server';
import sql from '@/db/index';
import { auth } from '@clerk/nextjs/server';

// GET /api/notes - Fetch all notes for the user
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const tag = url.searchParams.get('tag');
    const pinned = url.searchParams.get('pinned');

    // Build the query based on filters
    let query = sql`SELECT * FROM notes WHERE user_id = ${userId}`;
    
    // Add search filter
    if (search) {
      query = sql`${query} AND (title ILIKE ${'%' + search + '%'} OR content ILIKE ${'%' + search + '%'})`;
    }

    // Add tag filter
    if (tag) {
      query = sql`${query} AND ${tag} = ANY(tags)`;
    }

    // Add pinned filter
    if (pinned === 'true') {
      query = sql`${query} AND is_pinned = true`;
    } else if (pinned === 'false') {
      query = sql`${query} AND is_pinned = false`;
    }

    query = sql`${query} ORDER BY is_pinned DESC, updated_at DESC`;

    const notes = await query;
    return NextResponse.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notes - Create a new note
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, content, tags = [], isPinned = false } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO notes (user_id, title, content, tags, is_pinned)
      VALUES (${userId}, ${title}, ${content}, ${tags}, ${isPinned})
      RETURNING *
    `;

    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    console.error('Error creating note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}