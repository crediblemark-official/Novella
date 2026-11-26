import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { settings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminRequest } from '../admin/routes';
import { uploadCoverWithBackup } from '../../services/imagekit';

const ALLOWED_QRIS_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_QRIS_SIZE = 5 * 1024 * 1024; // 5MB

export const settingsModule = new Elysia()
  .get('/api/settings', async () => {
    const [existing] = await db.select().from(settings).limit(1);
    if (!existing) {
      return {
        adminWa: '6289629625458',
        companyAddress: 'Jl. Paingan (Depan Universitas Sanata Dharma), Krodan, Maguwoharjo, Depok, Sleman, D.I. Yogyakarta',
        companyTagline: 'Ruang Tumbuh Penulis Nusantara',
        bankAccounts: [
          { bankName: 'Bank Central Asia (BCA)', accountNumber: '8920192831', accountHolder: 'Penerbit Novella Nusantara' },
          { bankName: 'Bank Mandiri', accountNumber: '1370018291024', accountHolder: 'Penerbit Novella Nusantara' },
        ],
        qrisImageUrl: null,
        qrisMerchantName: null,
      };
    }

    let parsedBankAccounts = [];
    try {
      parsedBankAccounts = JSON.parse(existing.bankAccounts || '[]');
    } catch {
      parsedBankAccounts = [];
    }

    return {
      adminWa: existing.adminWa,
      companyAddress: existing.companyAddress,
      companyTagline: existing.companyTagline,
      bankAccounts: parsedBankAccounts,
      qrisImageUrl: existing.qrisImageUrl || null,
      qrisMerchantName: existing.qrisMerchantName || null,
    };
  })
  .post(
    '/api/admin/settings/qris',
    async ({ request, body, set }) => {
      const isAuthorized = await verifyAdminRequest(request);
      if (!isAuthorized) {
        set.status = 401;
        return { error: 'Akses ditolak. Khusus staf redaksi.' };
      }

      const file = body.file as File;
      if (!file) {
        set.status = 400;
        return { error: 'Gambar QRIS wajib dipilih.' };
      }
      if (file.size > MAX_QRIS_SIZE) {
        set.status = 413;
        return { error: 'Ukuran gambar QRIS maksimal 5 MB.' };
      }

      const originalName = file.name || 'qris.png';
      const dotIdx = originalName.lastIndexOf('.');
      const ext = dotIdx !== -1 ? originalName.substring(dotIdx).toLowerCase() : '';
      if (!ALLOWED_QRIS_EXTS.includes(ext)) {
        set.status = 400;
        return { error: 'Format gambar QRIS harus .jpg, .jpeg, .png, atau .webp.' };
      }

      const safeName = `qris_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const mimeType = file.type || 'image/png';
      const bytes = new Uint8Array(await file.arrayBuffer());
      const uploaded = await uploadCoverWithBackup(safeName, bytes, mimeType);

      return { success: true, ...uploaded };
    },
    { body: t.Object({ file: t.File() }) }
  )
  .put(
    '/api/admin/settings',
    async ({ request, body, set }) => {
      const isAuthorized = await verifyAdminRequest(request);
      if (!isAuthorized) {
        set.status = 401;
        return { error: 'Akses ditolak. Khusus staf redaksi.' };
      }

      const [existing] = await db.select().from(settings).limit(1);
      const bankAccountsStr = JSON.stringify(body.bankAccounts || []);
      const qrisImageUrl = body.qrisImageUrl?.trim() || null;
      const qrisMerchantName = body.qrisMerchantName?.trim() || null;
      const now = new Date();

      if (existing) {
        await db
          .update(settings)
          .set({
            adminWa: body.adminWa.trim(),
            companyAddress: body.companyAddress.trim(),
            companyTagline: body.companyTagline.trim(),
            bankAccounts: bankAccountsStr,
            qrisImageUrl,
            qrisMerchantName,
            updatedAt: now,
          })
          .where(eq(settings.id, existing.id));
      } else {
        await db.insert(settings).values({
          adminWa: body.adminWa.trim(),
          companyAddress: body.companyAddress.trim(),
          companyTagline: body.companyTagline.trim(),
          bankAccounts: bankAccountsStr,
          qrisImageUrl,
          qrisMerchantName,
          updatedAt: now,
        });
      }

      return {
        success: true,
        message: 'Pengaturan redaksi berhasil diperbarui.',
        settings: {
          adminWa: body.adminWa,
          companyAddress: body.companyAddress,
          companyTagline: body.companyTagline,
          bankAccounts: body.bankAccounts,
          qrisImageUrl,
          qrisMerchantName,
        },
      };
    },
    {
      body: t.Object({
        adminWa: t.String(),
        companyAddress: t.String(),
        companyTagline: t.String(),
        bankAccounts: t.Array(
          t.Object({
            bankName: t.String(),
            accountNumber: t.String(),
            accountHolder: t.String(),
          })
        ),
        qrisImageUrl: t.Optional(t.Union([t.String(), t.Null()])),
        qrisMerchantName: t.Optional(t.Union([t.String(), t.Null()])),
      }),
    }
  );
