import { NextRequest, NextResponse } from 'next/server';
import { getDb, Item, Tag } from '@/lib/db';
import { generateAiEnrichment } from '@/lib/ai';
import crypto from 'crypto';

function attachTagsToItem(db: any, itemId: string, tagNames: string[]) {
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

export async function POST(
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

    const aiResult = await generateAiEnrichment({
      title: item.title,
      description: item.description,
      content: item.content,
      url: item.url,
    });

    if (aiResult.summary) {
      db.prepare(`UPDATE items SET summary = ?, updated_at = ? WHERE id = ?`).run(
        aiResult.summary,
        Date.now(),
        id
      );
    }

    if (aiResult.tags && aiResult.tags.length > 0) {
      attachTagsToItem(db, id, aiResult.tags);
    }

    const updated = db.prepare(`SELECT * FROM items WHERE id = ?`).get(id) as Item;
    updated.tags = db
      .prepare(
        `SELECT t.id, t.name, t.color, t.created_at 
         FROM tags t 
         INNER JOIN item_tags it ON t.id = it.tag_id 
         WHERE it.item_id = ? 
         ORDER BY t.name ASC`
      )
      .all(id) as Tag[];

    return NextResponse.json({ item: updated, ai: aiResult });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
