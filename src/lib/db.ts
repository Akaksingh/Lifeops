import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'life-ops.db');
const db = new Database(DB_PATH);

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    source TEXT NOT NULL,         -- 'gmail' | 'notion' | 'drive' | 'calendar' | 'manual'
    source_url TEXT,
    due_date TEXT,                -- ISO date string or null
    type TEXT DEFAULT 'task',     -- 'task' | 'follow_up' | 'deadline' | 'recurring'
    done INTEGER DEFAULT 0,
    recurring INTEGER DEFAULT 0,
    followup INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    sync_count INTEGER DEFAULT 1  -- how many syncs this item has appeared in
  );

  CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    status TEXT NOT NULL,         -- 'success' | 'error'
    items_found INTEGER DEFAULT 0,
    synced_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS user_prefs (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

export default db;
