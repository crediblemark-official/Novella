import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { orders } from '../../db/schema';
import { calculatePrice } from './pricing';
import { desc, eq, and } from 'drizzle-orm';

const ADMIN_WA_NUMBER = '6281234567890'; // Sesuai PRD Novella.id

export function formatWaMessage(order: {
  orderCode: string;
  authorName: string;
  authorEmail: string;
  authorPhone: string;
  shippingAddress: string;
  bookTitle: string;
  fileOriginalName: string | null;
  pages: number;
  copies: number;
  bookSize: string;
  addons: string[];
  totalPrice: number;
}) {
  const formattedPrice = `Rp ${order.totalPrice.toLocaleString('id-ID')}`;
  const addonsStr = order.addons.length > 0 ? order.addons.join(', ') : '-';
  
  const text =
`Halo Admin Novella.id, saya telah membuat pesanan penerbitan naskah dengan rincian berikut:

• Kode Pesanan: ${order.orderCode}
• Nama Penulis: ${order.authorName}
• Email: ${order.authorEmail}
• No. WhatsApp: ${order.authorPhone}
• Alamat Pengiriman: ${order.shippingAddress}
• Judul Buku: ${order.bookTitle}
• Nama Berkas: ${order.fileOriginalName || 'Naskah'}
• Spesifikasi: ${order.pages} hal | ${order.copies} eks | ${order.bookSize}
• Add-on: ${addonsStr}
• Total Biaya: ${formattedPrice}

Mohon petunjuk untuk verifikasi pembayaran dan proses selanjutnya. Terima kasih!`;

  const url = `https://wa.me/${ADMIN_WA_NUMBER}?text=${encodeURIComponent(text)}`;
  return { text, url };
}

export const ordersModule = new Elysia({ prefix: '/api/orders' })
  .post(
    '/calculate',
    ({ body }) => {
      return calculatePrice(body);
    },
    {
      body: t.Object({
        pages: t.Number(),
        copies: t.Number(),
        bookSize: t.String(),
        addons: t.Array(t.String()),
      }),
    }
  )
  .get(
    '/',
    ({ query }) => {
      const { email } = query;
      if (email) {
        return db.select().from(orders).where(eq(orders.authorEmail, email)).orderBy(desc(orders.createdAt)).all();
      }
      return db.select().from(orders).orderBy(desc(orders.createdAt)).all();
    },
    {
      query: t.Object({
        email: t.Optional(t.String()),
      }),
    }
  )
  .get('/:code', ({ params, set }) => {
    const order = db.select().from(orders).where(eq(orders.orderCode, params.code)).get();
    if (!order) {
      set.status = 404;
      return { error: 'Pesanan tidak ditemukan.' };
    }
    return order;
  })
  .post(
    '/',
    async ({ body, set }) => {
      const pricing = calculatePrice({
        pages: body.pages,
        copies: body.copies,
        bookSize: body.bookSize,
        addons: body.addons,
      });

      // Generate order code NOV-XXXX
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const orderCode = `NOV-${randomSuffix}`;

      const now = Date.now();
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
        status: 'Menunggu Verifikasi',
        isRevoked: 0,
        createdAt: now,
        updatedAt: now,
      };

      const inserted = db.insert(orders).values(newOrder).returning().get();

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
    },
    {
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
        fileName: t.Optional(t.String()),
        fileOriginalName: t.Optional(t.String()),
        fileSize: t.Optional(t.Number()),
        fileMimeType: t.Optional(t.String()),
      }),
    }
  )
  .post('/:code/withdraw', ({ params, set }) => {
    const existing = db.select().from(orders).where(eq(orders.orderCode, params.code)).get();

    if (!existing) {
      set.status = 404;
      return { error: 'Pesanan tidak ditemukan.' };
    }

    if (existing.status !== 'Menunggu Verifikasi') {
      set.status = 400;
      return {
        error: `Naskah tidak dapat ditarik karena status pesanan saat ini adalah "${existing.status}". Penarikan hanya dapat dilakukan saat status "Menunggu Verifikasi".`,
      };
    }

    const updated = db
      .update(orders)
      .set({
        status: 'Ditarik Penulis',
        isRevoked: 1,
        updatedAt: Date.now(),
      })
      .where(eq(orders.orderCode, params.code))
      .returning()
      .get();

    return {
      success: true,
      message: 'Naskah berhasil ditarik secara mandiri oleh penulis. Akses unduh berkas redaksi telah dikunci.',
      order: updated,
    };
  })
  .patch(
    '/:code/status',
    ({ params, body, set }) => {
      const existing = db.select().from(orders).where(eq(orders.orderCode, params.code)).get();

      if (!existing) {
        set.status = 404;
        return { error: 'Pesanan tidak ditemukan.' };
      }

      if (existing.isRevoked === 1 && body.status !== 'Ditarik Penulis') {
        set.status = 400;
        return { error: 'Pesanan telah ditarik oleh penulis dan tidak dapat diubah statusnya.' };
      }

      const updated = db
        .update(orders)
        .set({
          status: body.status,
          updatedAt: Date.now(),
        })
        .where(eq(orders.orderCode, params.code))
        .returning()
        .get();

      return {
        success: true,
        order: updated,
      };
    },
    {
      body: t.Object({
        status: t.String(),
      }),
    }
  );
