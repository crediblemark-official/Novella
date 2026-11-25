import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { orders } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { readManuscriptFile, saveManuscriptFile } from '../../services/storage';

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
      const mimeType = file.type || 'application/octet-stream';
      const bytes = new Uint8Array(await file.arrayBuffer());
      const saved = await saveManuscriptFile(safeName, bytes, mimeType);

      return {
        success: true,
        fileName: saved.fileName,
        fileOriginalName: originalName,
        fileSize: file.size,
        fileMimeType: mimeType,
        storage: saved.storage,
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

    // Check file access gatekeeper in DB: if any order linking this file is revoked or expired
    const matchingOrders = await db.select().from(orders).where(eq(orders.fileName, fileName));

    if (matchingOrders.length > 0) {
      const isRevokedOrDeleted = matchingOrders.some(
        (o) => o.isRevoked === 1 || o.status === 'Ditarik Penulis' || o.status === 'Kedaluwarsa'
      );
      if (isRevokedOrDeleted) {
        set.status = 403;
        return {
          error: 'Akses naskah ditutup karena telah ditarik penulis (Access Revoked / Soft Deleted).',
        };
      }
    }

    const result = await readManuscriptFile(fileName);
    if (!result) {
      set.status = 404;
      return { error: 'Berkas naskah tidak ditemukan di server.' };
    }

    const firstOrder = matchingOrders[0];
    const disposition = `attachment; filename="${firstOrder?.fileOriginalName || fileName}"`;

    if (result.kind === 's3') {
      return new Response(result.response.body, {
        status: 200,
        headers: {
          'Content-Type':
            result.response.headers.get('content-type') ||
            firstOrder?.fileMimeType ||
            'application/octet-stream',
          'Content-Disposition': disposition,
        },
      });
    }

    set.headers['Content-Disposition'] = disposition;
    return result.file;
  });
