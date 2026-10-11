import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let dbInstance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!dbInstance) {
    const dataDir = process.env.DATA_DIR || path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'karakeep.db');
    dbInstance = new Database(dbPath);
    dbInstance.pragma('journal_mode = WAL');
    dbInstance.pragma('foreign_keys = ON');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL DEFAULT 'link', -- 'link', 'note'
      url TEXT,
      title TEXT NOT NULL,
      description TEXT,
      content TEXT,
      readable_html TEXT,
      image_url TEXT,
      favicon_url TEXT,
      summary TEXT,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE COLLATE NOCASE,
      color TEXT NOT NULL DEFAULT '#6366f1',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS item_tags (
      item_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (item_id, tag_id),
      FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- Full Text Search Table
    CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
      id UNINDEXED,
      title,
      description,
      content,
      summary,
      tokenize='unicode61'
    );

    -- Triggers to keep FTS updated
    CREATE TRIGGER IF NOT EXISTS items_ai AFTER INSERT ON items BEGIN
      INSERT INTO items_fts(id, title, description, content, summary)
      VALUES (new.id, coalesce(new.title, ''), coalesce(new.description, ''), coalesce(new.content, ''), coalesce(new.summary, ''));
    END;

    CREATE TRIGGER IF NOT EXISTS items_ad AFTER DELETE ON items BEGIN
      DELETE FROM items_fts WHERE id = old.id;
    END;

    CREATE TRIGGER IF NOT EXISTS items_au AFTER UPDATE ON items BEGIN
      DELETE FROM items_fts WHERE id = old.id;
      INSERT INTO items_fts(id, title, description, content, summary)
      VALUES (new.id, coalesce(new.title, ''), coalesce(new.description, ''), coalesce(new.content, ''), coalesce(new.summary, ''));
    END;
  `);

  // Default settings
  const defaultSettings: Record<string, string> = {
    ai_provider: 'ollama', // 'ollama' | 'openai'
    ollama_url: 'http://localhost:11434',
    ollama_model: 'llama3.2',
    openai_key: '',
    openai_base_url: 'https://api.openai.com/v1',
    openai_model: 'gpt-4o-mini',
    auto_ai_enrich: 'true',
    app_theme: 'dark'
  };

  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)
  `);

  for (const [key, value] of Object.entries(defaultSettings)) {
    insertSetting.run(key, value);
  }
}

export type ItemType = 'link' | 'note';

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: number;
}

export interface Item {
  id: string;
  type: ItemType;
  url: string | null;
  title: string;
  description: string | null;
  content: string | null;
  readable_html: string | null;
  image_url: string | null;
  favicon_url: string | null;
  summary: string | null;
  is_favorite: number;
  is_archived: number;
  created_at: number;
  updated_at: number;
  tags?: Tag[];
}
