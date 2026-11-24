import { Elysia } from 'elysia';
import { db } from '../../db';
import { orders } from '../../db/schema';
import { eq, ne } from 'drizzle-orm';

export const adminModule = new Elysia({ prefix: '/api/admin' })
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
