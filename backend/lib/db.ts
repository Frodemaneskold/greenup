import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { hashPassword } from './auth';

export type UserRow = {
  id: number;
  username: string;
  email?: string;
  password_hash: string;
  created_at: string;
  total_co2_saved?: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __db__: Database.Database | undefined;
}

function ensureDataDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getDb(): Database.Database {
  if (!global.__db__) {
    const dataDir = path.join(process.cwd(), 'data');
    ensureDataDir(dataDir);
    const dbPath = path.join(dataDir, 'app.db');
    const db = new Database(dbPath);

    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        total_co2_saved REAL NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS kv (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Ensure email column exists for older DBs
    const cols = db.prepare(`PRAGMA table_info('users')`).all() as Array<{ name: string }>;
    const hasEmail = cols.some(c => c.name === 'email');
    if (!hasEmail) {
      db.exec(`ALTER TABLE users ADD COLUMN email TEXT UNIQUE;`);
    }
    const hasCo2 = cols.some(c => c.name === 'total_co2_saved');
    if (!hasCo2) {
      db.exec(`ALTER TABLE users ADD COLUMN total_co2_saved REAL NOT NULL DEFAULT 0;`);
      db.exec(`UPDATE users SET total_co2_saved = 0 WHERE total_co2_saved IS NULL;`);
    }

    // One-time reset: set all users' total_co2_saved to 0 if not already done
    const co2Reset = db.prepare(`SELECT value FROM kv WHERE key = 'co2_reset_done'`).get() as { value: string } | undefined;
    if (!co2Reset) {
      db.exec(`UPDATE users SET total_co2_saved = 0;`);
      db.prepare(`INSERT INTO kv (key, value) VALUES ('co2_reset_done', datetime('now'))`).run();
    }

    global.__db__ = db;
  }
  return global.__db__!;
}

export async function ensureSeedUser(): Promise<void> {
  const db = getDb();
  const admin = db.prepare('SELECT * FROM users WHERE username = ?').get('admin') as UserRow | undefined;
  const passwordHash = await hashPassword('12345');
  if (!admin) {
    db.prepare('INSERT INTO users (username, email, password_hash, total_co2_saved) VALUES (?, ?, ?, 0)').run('admin', 'admin@example.com', passwordHash);
    return;
  }
  // Always ensure the admin password is 12345 (for local/dev convenience)
  db.prepare('UPDATE users SET password_hash = ?, email = COALESCE(email, ?), total_co2_saved = COALESCE(total_co2_saved, 0) WHERE username = ?').run(passwordHash, 'admin@example.com', 'admin');
}

export function getUserByUsername(username: string): UserRow | undefined {
  const db = getDb();
  return db
    .prepare('SELECT * FROM users WHERE lower(trim(username)) = lower(trim(?))')
    .get(username) as UserRow | undefined;
}

export function getUserByEmail(email: string): UserRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
}

export function createUserWithEmail(email: string, passwordHash: string): UserRow {
  const db = getDb();
  // Generate username from email local-part and ensure unique
  const base = email.split('@')[0].replace(/[^a-zA-Z0-9_.]/g, '').slice(0, 20) || 'user';
  let candidate = base;
  let n = 1;
  while (db.prepare('SELECT 1 FROM users WHERE username = ?').get(candidate)) {
    candidate = `${base}${n}`;
    n++;
  }
  const info = db.prepare('INSERT INTO users (username, email, password_hash, total_co2_saved) VALUES (?, ?, ?, 0)').run(candidate, email, passwordHash);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid) as UserRow;
}


