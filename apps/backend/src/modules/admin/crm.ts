import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { orders, user } from '../../db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { verifyAdminRequest } from './routes';

export const adminCrmModule = new Elysia({ prefix: '/api/admin' })
  // 1. Author CRM Directory
  .get('/authors', async ({ request, set }) => {
    const isAuthorized = await verifyAdminRequest(request);
    if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }

    const allUsers = await db.select().from(user).where(eq(user.role, 'author')).orderBy(desc(user.createdAt));
    const allOrders = await db.select().from(orders);

    const authorsWithMetrics = allUsers.map((u) => {
      const userOrders = allOrders.filter((o) => o.authorEmail.toLowerCase() === u.email.toLowerCase());
      const totalSpend = userOrders
        .filter((o) => o.status !== 'Ditarik Penulis' && o.status !== 'Kedaluwarsa')
        .reduce((sum, o) => sum + o.totalPrice, 0);

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone || userOrders[0]?.authorPhone || '-',
        address: u.address || userOrders[0]?.shippingAddress || '-',
        orderCount: userOrders.length,
        totalSpend,
        joinedAt: u.createdAt,
      };
    });

    return authorsWithMetrics;
  })
  // 1b. Delete Author Account
  .delete('/authors/:id', async ({ params, request, set }) => {
    const isAuthorized = await verifyAdminRequest(request);
    if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }

    const existing = await db.select({ id: user.id }).from(user).where(and(eq(user.id, params.id), eq(user.role, 'author')));
    if (existing.length === 0) {
      set.status = 404;
      return { error: 'Penulis tidak ditemukan' };
    }

    await db.delete(user).where(and(eq(user.id, params.id), eq(user.role, 'author')));
    return { success: true, deletedId: params.id };
  })
  // 2. Orders CSV Export
  .get('/orders/export-csv', async ({ request, set }) => {
    const isAuthorized = await verifyAdminRequest(request);
    if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }

    const allOrders = await db.select().from(orders).orderBy(desc(orders.createdAt));

    const headers = [
      'Kode Pesanan',
      'Penulis',
      'Email',
      'No. WhatsApp',
      'Judul Buku',
      'Kategori',
      'Halaman',
      'Eksemplar',
      'Ukuran',
      'Addon',
      'Total Biaya',
      'Status',
      'Kurir',
      'No. Resi',
      'Tanggal Pesanan',
    ];

    const rows = allOrders.map((o) => [
      `"${o.orderCode}"`,
      `"${o.authorName.replace(/"/g, '""')}"`,
      `"${o.authorEmail}"`,
      `"${o.authorPhone}"`,
      `"${o.bookTitle.replace(/"/g, '""')}"`,
      `"${o.category}"`,
      o.pages,
      o.copies,
      `"${o.bookSize}"`,
      `"${o.addons.replace(/"/g, '""')}"`,
      o.totalPrice,
      `"${o.status}"`,
      `"${o.shippingCourier || '-'}"`,
      `"${o.shippingTrackingNumber || '-'}"`,
      `"${new Date(o.createdAt).toISOString()}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="novella_orders_${Date.now()}.csv"`,
      },
    });
  })
  // 3. Update Shipping Tracking
  .patch(
    '/orders/:code/tracking',
    async ({ request, params, body, set }) => {
      const isAuthorized = await verifyAdminRequest(request);
      if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }

      const { code } = params;
      const [existing] = await db.select().from(orders).where(eq(orders.orderCode, code));
      if (!existing) { set.status = 404; return { error: 'Pesanan tidak ditemukan.' }; }

      const [updated] = await db
        .update(orders)
        .set({
          shippingCourier: body.shippingCourier,
          shippingTrackingNumber: body.shippingTrackingNumber,
          updatedAt: new Date(),
        })
        .where(eq(orders.orderCode, code))
        .returning();

      return {
        success: true,
        message: 'Informasi kurir dan resi berhasil diperbarui.',
        order: updated,
      };
    },
    {
      body: t.Object({
        shippingCourier: t.String(),
        shippingTrackingNumber: t.String(),
      }),
    }
  )
  // 4. Update Order Pricing & Pages (Upselling / Layout Revision)
  .patch(
    '/orders/:code/pricing',
    async ({ request, params, body, set }) => {
      const isAuthorized = await verifyAdminRequest(request);
      if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }

      const { code } = params;
      const [existing] = await db.select().from(orders).where(eq(orders.orderCode, code));
      if (!existing) { set.status = 404; return { error: 'Pesanan tidak ditemukan.' }; }

      const updateData: Record<string, any> = { updatedAt: new Date() };
      if (typeof body.pages === 'number') updateData.pages = body.pages;
      if (typeof body.totalPrice === 'number') updateData.totalPrice = body.totalPrice;
      if (body.status) updateData.status = body.status;

      const [updated] = await db
        .update(orders)
        .set(updateData)
        .where(eq(orders.orderCode, code))
        .returning();

      return {
        success: true,
        message: 'Spesifikasi halaman dan harga pesanan berhasil disesuaikan.',
        order: updated,
      };
    },
    {
      body: t.Object({
        pages: t.Optional(t.Number()),
        totalPrice: t.Optional(t.Number()),
        status: t.Optional(t.String()),
      }),
    }
  );
