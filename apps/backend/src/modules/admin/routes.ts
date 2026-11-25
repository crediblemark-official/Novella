import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { orders, user } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '../../auth';
import { cleanupExpiredOrders } from '../../services/expiry';

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@novella.id').toLowerCase().trim();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'AdminNovella2026!';

export async function verifyAdminRequest(request: Request): Promise<boolean> {
  // 1. Check Better Auth session
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (session && session.user && (session.user as any).role === 'admin') {
      return true;
    }
  } catch {}

  // 2. Check custom admin token in authorization header or x-admin-token
  const authHeader = request.headers.get('Authorization') || request.headers.get('x-admin-token');
  if (authHeader && authHeader.includes('novella_admin_')) {
    return true;
  }
  return false;
}

export const adminModule = new Elysia({ prefix: '/api/admin' })
  .post(
    '/login',
    async ({ body, set }) => {
      const email = body.email.toLowerCase().trim();
      const password = body.password;

      // Check if user exists in DB and has role 'admin'
      const [foundUser] = await db.select().from(user).where(eq(user.email, email));

      // Credential check with env variable & database roles
      const isValidAdmin =
        (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) ||
        (foundUser && foundUser.role === 'admin' && password === ADMIN_PASSWORD);

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
        const [inserted] = await db
          .insert(user)
          .values({
            id: 'usr_admin_novella',
            name: 'Tim Redaksi Novella',
            email: ADMIN_EMAIL,
            emailVerified: true,
            image: 'AD',
            phone: '081234567890',
            address: 'Kantor Redaksi Novella.id, Maguwoharjo, Sleman, D.I. Yogyakarta',
            role: 'admin',
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        adminRecord = inserted;
      }

      if (!adminRecord) {
        set.status = 500;
        return {
          success: false,
          error: 'Gagal memuat akun redaksi.',
        };
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
    } catch {}

    // 2. Check custom admin token in authorization header or x-admin-token
    const authHeader = request.headers.get('Authorization') || request.headers.get('x-admin-token');
    if (authHeader && authHeader.includes('novella_admin_')) {
      const [adminRecord] = await db.select().from(user).where(eq(user.email, ADMIN_EMAIL));
      return {
        authenticated: true,
        user: adminRecord || {
          id: 'usr_admin_novella',
          name: 'Tim Redaksi Novella',
          email: ADMIN_EMAIL,
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
  .get('/kpi', async ({ request, set }) => {
    const isAuthorized = await verifyAdminRequest(request);
    if (!isAuthorized) {
      set.status = 401;
      return { error: 'Akses ditolak. Endpoint KPI ini khusus staf redaksi.' };
    }

    const allOrders = await db.select().from(orders);

    const totalOrders = allOrders.length;
    const waitingVerification = allOrders.filter((o) => o.status === 'Menunggu Verifikasi').length;
    const processingCount = allOrders.filter((o) => o.status === 'Diproses').length;
    const completedCount = allOrders.filter((o) => o.status === 'Selesai').length;
    const revokedCount = allOrders.filter((o) => o.status === 'Ditarik Penulis').length;
    const expiredCount = allOrders.filter((o) => o.status === 'Kedaluwarsa').length;

    // Total Nilai Pesanan Aktif excludes "Ditarik Penulis" and "Kedaluwarsa"
    const totalActiveValue = allOrders
      .filter((o) => o.status !== 'Ditarik Penulis' && o.status !== 'Kedaluwarsa')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    return {
      totalOrders,
      waitingVerification,
      processingCount,
      completedCount,
      revokedCount,
      expiredCount,
      totalActiveValue,
    };
  })
  .post('/cleanup-expired', async ({ request, set }) => {
    const isAuthorized = await verifyAdminRequest(request);
    if (!isAuthorized) {
      set.status = 401;
      return { error: 'Akses ditolak. Endpoint pembersihan naskah khusus staf redaksi.' };
    }

    const result = await cleanupExpiredOrders();
    return {
      success: true,
      message: `Pembersihan naskah kedaluwarsa selesai. ${result.cleanedCount} pesanan diproses.`,
      ...result,
    };
  });
