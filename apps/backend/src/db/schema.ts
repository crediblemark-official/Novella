import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  googleId: text('google_id'),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  avatar: text('avatar'),
  phone: text('phone'),
  address: text('address'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

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
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
