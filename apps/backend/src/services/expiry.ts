import { db } from '../db';
import { orders } from '../db/schema';
import { eq, and, lt } from 'drizzle-orm';
import { deleteManuscriptFile } from './storage';

/**
 * 7 Days Expiry limit in milliseconds (168 hours)
 */
export const EXPIRY_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Automatically cleans up expired orders in 'Menunggu Verifikasi' older than 7 days.
 * Permanently removes physical manuscript files and marks status as 'Kedaluwarsa'.
 */
export async function cleanupExpiredOrders(): Promise<{ cleanedCount: number; orderCodes: string[] }> {
  try {
    const cutoffDate = new Date(Date.now() - EXPIRY_DURATION_MS);

    // Find orders eligible for auto-expiry
    const expiredOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, 'Menunggu Verifikasi'),
          lt(orders.createdAt, cutoffDate)
        )
      );

    if (expiredOrders.length === 0) {
      return { cleanedCount: 0, orderCodes: [] };
    }

    console.log(`⏰ [Auto-Expire] Found ${expiredOrders.length} order(s) awaiting verification older than 7 days.`);

    const cleanedCodes: string[] = [];

    for (const order of expiredOrders) {
      // 1. Hard Delete file physically from storage
      if (order.fileName) {
        await deleteManuscriptFile(order.fileName);
      }

      // 2. Mark order as 'Kedaluwarsa' with revocation and deletion timestamp
      await db
        .update(orders)
        .set({
          status: 'Kedaluwarsa',
          isRevoked: 1,
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      cleanedCodes.push(order.orderCode);
      console.log(`🗑️ [Auto-Expire] Order ${order.orderCode} expired and file deleted.`);
    }

    return { cleanedCount: cleanedCodes.length, orderCodes: cleanedCodes };
  } catch (err: any) {
    console.error('⚠️ [Auto-Expire Error] Failed during expired order cleanup:', err.message);
    return { cleanedCount: 0, orderCodes: [] };
  }
}

/**
 * Start periodic scheduler to check for expired orders every hour.
 */
let schedulerInterval: any = null;

export function startOrderExpiryScheduler() {
  // Run once immediately on startup
  cleanupExpiredOrders();

  // Run every 1 hour (3600000 ms)
  if (!schedulerInterval) {
    schedulerInterval = setInterval(() => {
      cleanupExpiredOrders();
    }, 60 * 60 * 1000);
  }

  console.log('⏱️ [Scheduler] Order 7-day auto-expiry background scheduler initialized.');
}

export function stopOrderExpiryScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
}
