import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { settings } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminRequest } from '../admin/routes';

export const settingsModule = new Elysia()
  .get('/api/settings', async () => {
    const [existing] = await db.select().from(settings).limit(1);
    if (!existing) {
      return {
        adminWa: '6281995100401',
        companyAddress: 'Jl. Paingan (Depan Universitas Sanata Dharma), Krodan, Maguwoharjo, Depok, Sleman, D.I. Yogyakarta',
        companyTagline: 'Ruang Tumbuh Penulis Nusantara',
        bankAccounts: [
          { bankName: 'Bank Central Asia (BCA)', accountNumber: '8920192831', accountHolder: 'Penerbit Novella Nusantara' },
          { bankName: 'Bank Mandiri', accountNumber: '1370018291024', accountHolder: 'Penerbit Novella Nusantara' },
        ],
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
    };
  })
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
      const now = new Date();

      if (existing) {
        await db
          .update(settings)
          .set({
            adminWa: body.adminWa.trim(),
            companyAddress: body.companyAddress.trim(),
            companyTagline: body.companyTagline.trim(),
            bankAccounts: bankAccountsStr,
            updatedAt: now,
          })
          .where(eq(settings.id, existing.id));
      } else {
        await db.insert(settings).values({
          adminWa: body.adminWa.trim(),
          companyAddress: body.companyAddress.trim(),
          companyTagline: body.companyTagline.trim(),
          bankAccounts: bankAccountsStr,
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
      }),
    }
  );
