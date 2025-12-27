import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { hashPassword } from './auth';

type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
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
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    global.__db__ = db;
  }
  return global.__db__!;
}

export async function ensureSeedUser(): Promise<void> {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (count.c === 0) {
    const passwordHash = await hashPassword('admin123');
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', passwordHash);
  }
}

export function getUserByUsername(username: string): UserRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
}

import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { hashPassword } from './auth';

type UserRow = {
  id: number;
  username: string;
  password_hash: string;
  created_at: string;
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
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
    if (count.c === 0) {
      // Seed a default user for testing
      const passwordHash = hashPassword('admin123'); // returns Promise<string>
      // better-sqlite3 is sync; wait for hash outside SQL.
      // We'll block here by using deasync-like workaround is overkill; instead, use an init function below.
    }

    global.__db__ = db;
  }
  return global.__db__!;
}

export async function ensureSeedUser(): Promise<void> {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number };
  if (count.c === 0) {
    const passwordHash = await hashPassword('admin123');
    db.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run('admin', passwordHash);
  }
}

export function getUserByUsername(username: string): UserRow | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
}



