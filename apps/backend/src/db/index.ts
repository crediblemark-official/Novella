import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import * as schema from './schema';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dataDir = join(import.meta.dir, '../../data');
if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(join(dataDir, 'novella.sqlite'));
sqlite.exec('PRAGMA journal_mode = WAL;');

// Initialize tables if they do not exist
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar TEXT,
    phone TEXT,
    address TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_code TEXT NOT NULL UNIQUE,
    author_name TEXT NOT NULL,
    author_email TEXT NOT NULL,
    author_phone TEXT NOT NULL,
    shipping_address TEXT NOT NULL,
    book_title TEXT NOT NULL,
    category TEXT NOT NULL,
    pages INTEGER NOT NULL,
    copies INTEGER NOT NULL,
    book_size TEXT NOT NULL,
    addons TEXT NOT NULL,
    file_name TEXT,
    file_original_name TEXT,
    file_size INTEGER,
    file_mime_type TEXT,
    total_price INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'Menunggu Verifikasi',
    is_revoked INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
`);

export const db = drizzle(sqlite, { schema });
