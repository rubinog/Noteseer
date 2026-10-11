import { NextRequest, NextResponse } from 'next/server';
import { getDb, Item, Tag } from '@/lib/db';
import { scrapeUrl } from '@/lib/scraper';
import { generateAiEnrichment, getAiSettings } from '@/lib/ai';
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

    // Pick deterministic color based on string hash
    const hash = cleanName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[hash % colors.length];

    const tagId = crypto.randomUUID();
    const row = insertTag.get(tagId, cleanName, color, Date.now()) as { id: string } | undefined;
    const finalTagId = row ? row.id : tagId;
    linkTag.run(itemId, finalTagId);
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search')?.trim();
    const type = searchParams.get('type')?.trim();
    const tag = searchParams.get('tag')?.trim();
    const filter = searchParams.get('filter')?.trim() || 'all'; // 'all', 'favorites', 'archived'

    let query = `
      SELECT DISTINCT i.* 
      FROM items i
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (tag) {
      query += ` INNER JOIN item_tags it ON i.id = it.item_id INNER JOIN tags t ON it.tag_id = t.id `;
      conditions.push(`t.name = ?`);
      params.push(tag.toLowerCase());
    }

    if (search) {
      // Use FTS5 index
      query += ` INNER JOIN items_fts fts ON i.id = fts.id `;
      // Format search string for FTS5 (safe tokenization)
      const sanitizedSearch = search
        .replace(/["'*]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .map((term) => `"${term}"*`)
        .join(' AND ');

      if (sanitizedSearch) {
        conditions.push(`items_fts MATCH ?`);
        params.push(sanitizedSearch);
      }
    }

    if (filter === 'favorites') {
      conditions.push(`i.is_favorite = 1 AND i.is_archived = 0`);
    } else if (filter === 'archived') {
      conditions.push(`i.is_archived = 1`);
    } else {
      conditions.push(`i.is_archived = 0`);
    }

    if (type && ['link', 'note'].includes(type)) {
      conditions.push(`i.type = ?`);
      params.push(type);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY i.created_at DESC LIMIT 150`;

    const rawItems = db.prepare(query).all(...params) as Item[];

    const items = rawItems.map((item) => ({
      ...item,
      tags: getTagsForItem(db, item.id),
    }));

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error('Error fetching items:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();
    const { type = 'link', url, title, content, tags = [] } = body;

    const id = crypto.randomUUID();
    const now = Date.now();

    let finalTitle = (title || '').trim();
    let finalDescription = '';
    let finalContent = (content || '').trim();
    let readableHtml: string | null = null;
    let imageUrl: string | null = null;
    let faviconUrl: string | null = null;

    if (type === 'link') {
      if (!url) {
        return NextResponse.json({ error: 'URL is required for links' }, { status: 400 });
      }

      try {
        const scraped = await scrapeUrl(url);
        finalTitle = finalTitle || scraped.title;
        finalDescription = scraped.description;
        finalContent = finalContent || scraped.content || '';
        readableHtml = scraped.readable_html;
        imageUrl = scraped.image_url;
        faviconUrl = scraped.favicon_url;
      } catch (scrapeErr: any) {
        console.warn('Scraping error:', scrapeErr);
        if (!finalTitle) {
          try {
            finalTitle = new URL(url).hostname;
          } catch {
            finalTitle = url;
          }
        }
      }
    }

    if (!finalTitle) {
      finalTitle = type === 'note' ? 'Untitled Note' : 'Untitled Link';
    }

    db.prepare(`
      INSERT INTO items (
        id, type, url, title, description, content, readable_html, image_url, favicon_url, 
        summary, is_favorite, is_archived, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)
    `).run(
      id,
      type,
      url || null,
      finalTitle,
      finalDescription || null,
      finalContent || null,
      readableHtml,
      imageUrl,
      faviconUrl,
      null,
      now,
      now
    );

    if (Array.isArray(tags) && tags.length > 0) {
      attachTagsToItem(db, id, tags);
    }

    // Check if auto AI enrichment is enabled
    const settings = getAiSettings();
    if (settings.auto_ai_enrich === 'true') {
      // Enrich non-blocking or inline
      try {
        const aiResult = await generateAiEnrichment({
          title: finalTitle,
          description: finalDescription,
          content: finalContent,
          url: url || null,
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
      } catch (aiErr: any) {
        console.warn('Auto AI enrichment skipped/failed:', aiErr.message);
      }
    }

    const createdItem = db.prepare(`SELECT * FROM items WHERE id = ?`).get(id) as Item;
    createdItem.tags = getTagsForItem(db, id);

    return NextResponse.json({ item: createdItem }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating item:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
