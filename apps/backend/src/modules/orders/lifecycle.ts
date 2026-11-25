import { db } from '../../db';
import { orders } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { deleteManuscriptFile } from '../../services/storage';

export async function withdrawOrder(orderCode: string) {
  const [existing] = await db.select().from(orders).where(eq(orders.orderCode, orderCode));
  if (!existing) return { error: 'Pesanan tidak ditemukan.', status: 404 };

  const canWithdraw = existing.status === 'Menunggu Verifikasi' || existing.status === 'Menunggu Konsultasi';
  if (!canWithdraw) {
    return {
      error: `Naskah tidak dapat ditarik karena status pesanan saat ini adalah "${existing.status}".`,
      status: 400,
    };
  }

  if (existing.fileName) {
    await deleteManuscriptFile(existing.fileName);
  }

  const now = new Date();
  const [updated] = await db
    .update(orders)
    .set({
      status: 'Ditarik Penulis',
      isRevoked: 1,
      deletedAt: now,
      updatedAt: now,
    })
    .where(eq(orders.orderCode, orderCode))
    .returning();

  return {
    success: true,
    message: 'Naskah berhasil ditarik secara mandiri oleh penulis.',
    order: updated,
    deletedAt: now.toISOString(),
  };
}

export async function changeOrderStatus(orderCode: string, newStatus: string) {
  const [existing] = await db.select().from(orders).where(eq(orders.orderCode, orderCode));
  if (!existing) return { error: 'Pesanan tidak ditemukan.', status: 404 };

  if (existing.status === 'Ditarik Penulis' || existing.status === 'Kedaluwarsa') {
    return {
      error: `Pesanan telah berstatus "${existing.status}" dan bersifat final sehingga tidak dapat diubah lagi.`,
      status: 400,
    };
  }

  const updatePayload: Record<string, any> = {
    status: newStatus,
    updatedAt: new Date(),
  };

  if (newStatus === 'Kedaluwarsa' || newStatus === 'Ditarik Penulis') {
    if (existing.fileName) await deleteManuscriptFile(existing.fileName);
    updatePayload.isRevoked = 1;
    updatePayload.deletedAt = new Date();
  }

  const [updated] = await db
    .update(orders)
    .set(updatePayload)
    .where(eq(orders.orderCode, orderCode))
    .returning();

  return { success: true, order: updated };
}
