import { pgTable, text, integer, boolean, timestamp, serial } from 'drizzle-orm/pg-core';

// Better Auth Standard Tables
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  phone: text('phone'),
  address: text('address'),
  role: text('role').default('author'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Backward-compatible alias for existing tests
export const users = user;

// Orders Table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
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
  status: text('status').notNull().default('Menunggu Verifikasi'),
  isRevoked: integer('is_revoked').notNull().default(0),
  shippingCourier: text('shipping_courier'),
  shippingTrackingNumber: text('shipping_tracking_number'),
  paymentProofUrl: text('payment_proof_url'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// System Settings Table
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  adminWa: text('admin_wa').notNull(),
  companyAddress: text('company_address').notNull(),
  companyTagline: text('company_tagline').notNull(),
  bankAccounts: text('bank_accounts').notNull(), // JSON string array
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Published Books Showcase Table
export const publishedBooks = pgTable('published_books', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  authorName: text('author_name').notNull(),
  category: text('category').notNull(),
  pages: integer('pages').notNull().default(100),
  bookSize: text('book_size').notNull().default('A5'),
  coverUrl: text('cover_url'),
  synopsis: text('synopsis'),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// Testimonials Table
export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  authorName: text('author_name').notNull(),
  roleOrCity: text('role_or_city').notNull(),
  quote: text('quote').notNull(),
  rating: integer('rating').notNull().default(5),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Setting = typeof settings.$inferSelect;
export type PublishedBook = typeof publishedBooks.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
