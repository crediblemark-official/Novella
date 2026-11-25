import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://situsbisnis:situsbisnis_dev_pw@localhost:5433/novella';

export const client = postgres(connectionString, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
  onnotice: () => {},
});

export const db = drizzle(client, { schema });

// Automatic table initialization on startup for clean deployments
export async function initDatabase() {
  await client`
    CREATE TABLE IF NOT EXISTS "user" (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      image TEXT,
      phone TEXT,
      address TEXT,
      role TEXT DEFAULT 'author',
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS "session" (
      id TEXT PRIMARY KEY,
      expires_at TIMESTAMP NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
      ip_address TEXT,
      user_agent TEXT,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS "account" (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      provider_id TEXT NOT NULL,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      access_token TEXT,
      refresh_token TEXT,
      id_token TEXT,
      access_token_expires_at TIMESTAMP,
      refresh_token_expires_at TIMESTAMP,
      scope TEXT,
      password TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS "verification" (
      id TEXT PRIMARY KEY,
      identifier TEXT NOT NULL,
      value TEXT NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await client`
    CREATE TABLE IF NOT EXISTS "orders" (
      id SERIAL PRIMARY KEY,
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
      deleted_at TIMESTAMP,
      created_at TIMESTAMP NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP NOT NULL DEFAULT NOW()
    )
  `;

  await client`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
  `;
}
