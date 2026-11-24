import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { user as userTable } from '../../db/schema';
import { eq } from 'drizzle-orm';

export const authModule = new Elysia({ prefix: '/api/auth' })
  .post(
    '/google',
    async ({ body }) => {
      const email = body.email.toLowerCase().trim();
      let [existingUser] = await db.select().from(userTable).where(eq(userTable.email, email));

      const now = new Date();
      if (!existingUser) {
        const [newUser] = await db
          .insert(userTable)
          .values({
            id: body.googleId || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            name: body.name,
            email,
            emailVerified: true,
            image: body.avatar || body.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase(),
            phone: body.phone || null,
            address: body.address || null,
            role: 'author',
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        existingUser = newUser;
      }

      if (!existingUser) {
        return {
          success: false,
          error: 'Gagal memproses data akun pengguna.',
        };
      }

      return {
        success: true,
        user: existingUser,
        isProfileComplete: Boolean(existingUser.phone && existingUser.address),
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
    async ({ body, set }) => {
      const email = body.email.toLowerCase().trim();
      const [existing] = await db.select().from(userTable).where(eq(userTable.email, email));

      if (!existing) {
        set.status = 404;
        return { error: 'Pengguna tidak ditemukan.' };
      }

      const [updated] = await db
        .update(userTable)
        .set({
          phone: body.phone,
          address: body.address,
          updatedAt: new Date(),
        })
        .where(eq(userTable.email, email))
        .returning();

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
    async ({ query, set }) => {
      const { email } = query;
      if (!email) {
        set.status = 400;
        return { error: 'Parameter email wajib disertakan.' };
      }

      const [found] = await db.select().from(userTable).where(eq(userTable.email, email.toLowerCase().trim()));
      if (!found) {
        set.status = 404;
        return { error: 'Pengguna tidak ditemukan.' };
      }

      return { user: found };
    },
    {
      query: t.Object({
        email: t.String(),
      }),
    }
  );
