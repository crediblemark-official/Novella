import { Elysia, t } from 'elysia';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { db } from '../../db';
import { orders } from '../../db/schema';
import { eq } from 'drizzle-orm';

const uploadsDir = join(import.meta.dir, '../../../uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.txt'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB per PRD

export const uploadModule = new Elysia({ prefix: '/api' })
  .post(
    '/upload',
    async ({ body, set }) => {
      const file = body.file as File;
      if (!file) {
        set.status = 400;
        return { error: 'Berkas naskah wajib diunggah.' };
      }

      if (file.size > MAX_FILE_SIZE) {
        set.status = 413;
        return { error: 'Ukuran berkas melebihi batas maksimal 50 MB.' };
      }

      const originalName = file.name || 'manuscript.pdf';
      const ext = originalName.substring(originalName.lastIndexOf('.')).toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        set.status = 400;
        return { error: 'Format berkas tidak didukung. Harap unggah berkas .pdf, .doc, .docx, atau .txt.' };
      }

      const safeName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const targetPath = join(uploadsDir, safeName);

      const arrayBuffer = await file.arrayBuffer();
      await Bun.write(targetPath, arrayBuffer);

      return {
        success: true,
        fileName: safeName,
        fileOriginalName: originalName,
        fileSize: file.size,
        fileMimeType: file.type || 'application/octet-stream',
      };
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    }
  )
  .get('/files/:fileName', async ({ params, set }) => {
    const { fileName } = params;

    // Check file access gatekeeper in DB
    const matchingOrder = db.select().from(orders).where(eq(orders.fileName, fileName)).get();

    if (matchingOrder) {
      if (matchingOrder.isRevoked === 1 || matchingOrder.status === 'Ditarik Penulis') {
        set.status = 403;
        return {
          error: 'Akses naskah ditutup karena telah ditarik penulis (Access Revoked / Soft Deleted).',
        };
      }
    }

    const filePath = join(uploadsDir, fileName);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      set.status = 404;
      return { error: 'Berkas naskah tidak ditemukan di server.' };
    }

    set.headers['Content-Disposition'] = `attachment; filename="${matchingOrder?.fileOriginalName || fileName}"`;
    return file;
  });
