import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const authModule = new Elysia({ prefix: '/api/auth' })
  .post(
    '/google',
    ({ body }) => {
      const email = body.email.toLowerCase().trim();
      let user = db.select().from(users).where(eq(users.email, email)).get();

      const now = Date.now();
      if (!user) {
        user = db
          .insert(users)
          .values({
            googleId: body.googleId || `g_${Date.now()}`,
            name: body.name,
            email,
            avatar: body.avatar || body.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
            phone: body.phone || null,
            address: body.address || null,
            createdAt: now,
            updatedAt: now,
          })
          .returning()
          .get();
      }

      return {
        success: true,
        user,
        isProfileComplete: Boolean(user.phone && user.address),
      };
    },
    {
      body: t.Object({
        email: t.String(),
        name: t.String(),
        googleId: t.Optional(t.String()),
        avatar: t.Optional(t.String()),
        phone: t.Optional(t.String()),
        address: t.Optional(t.String()),
      }),
    }
  )
  .post(
    '/profile',
    ({ body, set }) => {
      const email = body.email.toLowerCase().trim();
      const existing = db.select().from(users).where(eq(users.email, email)).get();

      if (!existing) {
        set.status = 404;
        return { error: 'Pengguna tidak ditemukan.' };
      }

      const updated = db
        .update(users)
        .set({
          phone: body.phone,
          address: body.address,
          updatedAt: Date.now(),
        })
        .where(eq(users.email, email))
        .returning()
        .get();

      return {
        success: true,
        user: updated,
      };
    },
    {
      body: t.Object({
        email: t.String(),
        phone: t.String(),
        address: t.String(),
      }),
    }
  )
  .get(
    '/user',
    ({ query, set }) => {
      const { email } = query;
      if (!email) {
        set.status = 400;
        return { error: 'Parameter email wajib disertakan.' };
      }

      const user = db.select().from(users).where(eq(users.email, email.toLowerCase().trim())).get();
      if (!user) {
        set.status = 404;
        return { error: 'Pengguna tidak ditemukan.' };
      }

      return { user };
    },
    {
      query: t.Object({
        email: t.String(),
      }),
    }
  );
