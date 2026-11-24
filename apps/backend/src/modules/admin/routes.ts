import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { orders, user } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '../../auth';

export const adminModule = new Elysia({ prefix: '/api/admin' })
  .post(
    '/login',
    async ({ body, set }) => {
      const email = body.email.toLowerCase().trim();
      const password = body.password;

      // Check if user exists in DB and has role 'admin'
      const foundUser = db.select().from(user).where(eq(user.email, email)).get();

      // Standard credential check for Novella editorial staff
      const isValidAdmin =
        (email === 'admin@novella.id' && password === 'AdminNovella2026!') ||
        (foundUser && foundUser.role === 'admin' && password === 'AdminNovella2026!');

      if (!isValidAdmin) {
        set.status = 401;
        return {
          success: false,
          error: 'Email atau kata sandi staf redaksi tidak cocok.',
        };
      }

      // Ensure user exists in DB
      let adminRecord = foundUser;
      if (!adminRecord) {
        const now = new Date();
        adminRecord = db
          .insert(user)
          .values({
            id: 'usr_admin_novella',
            name: 'Tim Redaksi Novella',
            email: 'admin@novella.id',
            emailVerified: true,
            image: 'AD',
            phone: '081234567890',
            address: 'Kantor Redaksi Novella.id, Maguwoharjo, Sleman, D.I. Yogyakarta',
            role: 'admin',
            createdAt: now,
            updatedAt: now,
          })
          .returning()
          .get();
      }

      const adminToken = `novella_admin_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      return {
        success: true,
        token: adminToken,
        user: {
          id: adminRecord.id,
          name: adminRecord.name,
          email: adminRecord.email,
          role: 'admin',
        },
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .get('/verify', async ({ request, set }) => {
    // 1. Check Better Auth session first
    try {
      const session = await auth.api.getSession({ headers: request.headers });
      if (session && session.user && (session.user as any).role === 'admin') {
        return {
          authenticated: true,
          user: session.user,
        };
      }
    } catch {
      // fallback
    }

    // 2. Check custom admin token in authorization header or x-admin-token
    const authHeader = request.headers.get('Authorization') || request.headers.get('x-admin-token');
    if (authHeader && authHeader.includes('novella_admin_')) {
      const adminRecord = db.select().from(user).where(eq(user.email, 'admin@novella.id')).get();
      return {
        authenticated: true,
        user: adminRecord || {
          id: 'usr_admin_novella',
          name: 'Tim Redaksi Novella',
          email: 'admin@novella.id',
          role: 'admin',
        },
      };
    }

    set.status = 401;
    return {
      authenticated: false,
      error: 'Sesi redaksi tidak ditemukan atau telah kedaluwarsa.',
    };
  })
  .post('/logout', () => {
    return { success: true };
  })
  .get('/kpi', () => {
    const allOrders = db.select().from(orders).all();

    const totalOrders = allOrders.length;
    const waitingVerification = allOrders.filter((o) => o.status === 'Menunggu Verifikasi').length;
    const processingCount = allOrders.filter((o) => o.status === 'Diproses').length;
    const completedCount = allOrders.filter((o) => o.status === 'Selesai').length;
    const revokedCount = allOrders.filter((o) => o.status === 'Ditarik Penulis').length;

    // Total Nilai Pesanan Aktif excludes "Ditarik Penulis"
    const totalActiveValue = allOrders
      .filter((o) => o.status !== 'Ditarik Penulis')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    return {
      totalOrders,
      waitingVerification,
      processingCount,
      completedCount,
      revokedCount,
      totalActiveValue,
    };
  });
