import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getAiSettings } from '@/lib/ai';

export async function GET() {
  try {
    const settings = getAiSettings();
    return NextResponse.json({ settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb();
    const body = await req.json();

    const stmt = db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `);

    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        stmt.run(key, value);
      }
    }

    const updated = getAiSettings();
    return NextResponse.json({ settings: updated, success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
