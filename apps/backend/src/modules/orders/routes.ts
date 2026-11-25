import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { orders } from '../../db/schema';
import { calculatePrice } from './pricing';
import { desc, eq } from 'drizzle-orm';
import { formatWaMessage } from './formatter';
import { withdrawOrder, changeOrderStatus } from './lifecycle';

export { formatWaMessage } from './formatter';

export const ordersModule = new Elysia({ prefix: '/api/orders' })
  .post('/calculate', ({ body }) => calculatePrice(body), {
    body: t.Object({
      pages: t.Number(),
      copies: t.Number(),
      bookSize: t.String(),
      addons: t.Array(t.String()),
      printType: t.Optional(t.String()),
      paperType: t.Optional(t.String()),
      coverType: t.Optional(t.String()),
    }),
  })
  .get('/', async ({ query }) => {
    const { email } = query;
    if (email) {
      return await db.select().from(orders).where(eq(orders.authorEmail, email)).orderBy(desc(orders.createdAt));
    }
    return await db.select().from(orders).orderBy(desc(orders.createdAt));
  }, {
    query: t.Object({ email: t.Optional(t.String()) }),
  })
  .get('/:code', async ({ params, set }) => {
    const [order] = await db.select().from(orders).where(eq(orders.orderCode, params.code));
    if (!order) { set.status = 404; return { error: 'Pesanan tidak ditemukan.' }; }
    return order;
  })
  .post('/', async ({ body, set }) => {
    const pricing = calculatePrice({
      pages: body.pages,
      copies: body.copies,
      bookSize: body.bookSize,
      addons: body.addons,
      printType: body.printType,
      paperType: body.paperType,
      coverType: body.coverType,
    });

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderCode = `NOV-${randomSuffix}`;
    const now = new Date();

    const newOrder = {
      orderCode,
      authorName: body.authorName,
      authorEmail: body.authorEmail,
      authorPhone: body.authorPhone,
      shippingAddress: body.shippingAddress,
      bookTitle: body.bookTitle,
      category: body.category,
      pages: body.pages,
      copies: body.copies,
      bookSize: body.bookSize,
      addons: JSON.stringify(body.addons),
      fileName: body.fileName || null,
      fileOriginalName: body.fileOriginalName || null,
      fileSize: body.fileSize || 0,
      fileMimeType: body.fileMimeType || '',
      totalPrice: pricing.totalPrice,
      status: body.status || 'Menunggu Konsultasi',
      isRevoked: 0,
      createdAt: now,
      updatedAt: now,
    };

    const [inserted] = await db.insert(orders).values(newOrder).returning();
    if (!inserted) { set.status = 500; return { error: 'Gagal menyimpan pesanan.' }; }

    const waInfo = formatWaMessage({
      orderCode: inserted.orderCode,
      authorName: inserted.authorName,
      authorEmail: inserted.authorEmail,
      authorPhone: inserted.authorPhone,
      shippingAddress: inserted.shippingAddress,
      bookTitle: inserted.bookTitle,
      fileOriginalName: inserted.fileOriginalName,
      pages: inserted.pages,
      copies: inserted.copies,
      bookSize: inserted.bookSize,
      addons: body.addons,
      totalPrice: inserted.totalPrice,
    });

    return {
      success: true,
      order: inserted,
      waUrl: waInfo.url,
      waMessage: waInfo.text,
    };
  }, {
    body: t.Object({
      authorName: t.String(),
      authorEmail: t.String(),
      authorPhone: t.String(),
      shippingAddress: t.String(),
      bookTitle: t.String(),
      category: t.String(),
      pages: t.Number(),
      copies: t.Number(),
      bookSize: t.String(),
      addons: t.Array(t.String()),
      printType: t.Optional(t.String()),
      paperType: t.Optional(t.String()),
      coverType: t.Optional(t.String()),
      fileName: t.Optional(t.String()),
      fileOriginalName: t.Optional(t.String()),
      fileSize: t.Optional(t.Number()),
      fileMimeType: t.Optional(t.String()),
      status: t.Optional(t.String()),
    }),
  })
  .post('/:code/withdraw', async ({ params, set }) => {
    const res = await withdrawOrder(params.code);
    if (res.error) { set.status = res.status; return { error: res.error }; }
    return res;
  })
  .patch('/:code/status', async ({ params, body, set }) => {
    const res = await changeOrderStatus(params.code, body.status);
    if (res.error) { set.status = res.status; return { error: res.error }; }
    return res;
  }, {
    body: t.Object({ status: t.String() }),
  })
  .post('/:code/payment-proof', async ({ params, body, set }) => {
    const [existing] = await db.select().from(orders).where(eq(orders.orderCode, params.code));
    if (!existing) { set.status = 404; return { error: 'Pesanan tidak ditemukan.' }; }
    const [updated] = await db
      .update(orders)
      .set({ paymentProofUrl: body.proofUrl, updatedAt: new Date() })
      .where(eq(orders.orderCode, params.code))
      .returning();
    return { success: true, order: updated };
  }, {
    body: t.Object({ proofUrl: t.String() }),
  });
