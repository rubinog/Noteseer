import { NextRequest, NextResponse } from 'next/server';
import { getDb, Item, Tag } from '@/lib/db';
import crypto from 'crypto';

function getTagsForItem(db: any, itemId: string): Tag[] {
  return db
    .prepare(
      `SELECT t.id, t.name, t.color, t.created_at 
       FROM tags t 
       INNER JOIN item_tags it ON t.id = it.tag_id 
       WHERE it.item_id = ? 
       ORDER BY t.name ASC`
    )
    .all(itemId) as Tag[];
}

function updateItemTags(db: any, itemId: string, tagNames: string[]) {
  db.prepare(`DELETE FROM item_tags WHERE item_id = ?`).run(itemId);

  const insertTag = db.prepare(
    `INSERT INTO tags (id, name, color, created_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(name) DO UPDATE SET name = excluded.name RETURNING id`
  );
  const linkTag = db.prepare(
    `INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)`
  );

  const colors = [
    '#6366f1', '#ec4899', '#3b82f6', '#10b981', '#f59e0b',
    '#8b5cf6', '#14b8a6', '#f43f5e', '#06b6d4', '#84cc16'
  ];

  for (const name of tagNames) {
    const cleanName = name.trim().toLowerCase();
    if (!cleanName) continue;

    const hash = cleanName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[hash % colors.length];

    const tagId = crypto.randomUUID();
    const row = insertTag.get(tagId, cleanName, color, Date.now()) as { id: string } | undefined;
    const finalTagId = row ? row.id : tagId;
    linkTag.run(itemId, finalTagId);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const item = db.prepare(`SELECT * FROM items WHERE id = ?`).get(id) as Item | undefined;

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    item.tags = getTagsForItem(db, id);
    return NextResponse.json({ item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    const body = await req.json();

    const existing = db.prepare(`SELECT * FROM items WHERE id = ?`).get(id) as Item | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields = ['title', 'content', 'description', 'summary', 'is_favorite', 'is_archived'];
    for (const field of allowedFields) {
      if (field in body) {
        updates.push(`${field} = ?`);
        values.push(body[field]);
      }
    }

    if (updates.length > 0) {
      updates.push(`updated_at = ?`);
      values.push(Date.now());
      values.push(id);

      db.prepare(`UPDATE items SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    }

    if (Array.isArray(body.tags)) {
      updateItemTags(db, id, body.tags);
    }

    const updated = db.prepare(`SELECT * FROM items WHERE id = ?`).get(id) as Item;
    updated.tags = getTagsForItem(db, id);

    return NextResponse.json({ item: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = getDb();
    db.prepare(`DELETE FROM items WHERE id = ?`).run(id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
