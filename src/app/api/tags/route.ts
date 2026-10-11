import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const tags = db.prepare(`
      SELECT t.id, t.name, t.color, COUNT(it.item_id) as count
      FROM tags t
      LEFT JOIN item_tags it ON t.id = it.tag_id
      LEFT JOIN items i ON it.item_id = i.id AND i.is_archived = 0
      GROUP BY t.id
      ORDER BY count DESC, t.name ASC
    `).all();

    return NextResponse.json({ tags });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
