import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

// Better Auth Standard Tables
export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  phone: text('phone'),
  address: text('address'),
  role: text('role').default('author'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  token: text('token').notNull().unique(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull(),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'),
  password: text('password'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// Backward-compatible alias for existing tests
export const users = user;

// Orders Table
export const orders = sqliteTable('orders', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  orderCode: text('order_code').notNull().unique(),
  authorName: text('author_name').notNull(),
  authorEmail: text('author_email').notNull(),
  authorPhone: text('author_phone').notNull(),
  shippingAddress: text('shipping_address').notNull(),
  bookTitle: text('book_title').notNull(),
  category: text('category').notNull(),
  pages: integer('pages').notNull(),
  copies: integer('copies').notNull(),
  bookSize: text('book_size').notNull(),
  addons: text('addons').notNull(), // JSON string array
  fileName: text('file_name'),
  fileOriginalName: text('file_original_name'),
  fileSize: integer('file_size'),
  fileMimeType: text('file_mime_type'),
  totalPrice: integer('total_price').notNull(),
  status: text('status').notNull().default('Menunggu Verifikasi'), // 'Menunggu Verifikasi' | 'Diproses' | 'Selesai' | 'Ditarik Penulis'
  isRevoked: integer('is_revoked').notNull().default(0),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
