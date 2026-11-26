import { Buffer } from 'node:buffer';
import { existsSync, mkdirSync } from 'node:fs';
import { basename, join } from 'node:path';
import { getS3Client } from './s3';
import { uploadsDir } from './storage';

const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

export interface CoverUploadResult {
  url: string;
  provider: 'imagekit' | 'gdrives3' | 'local';
  backupStorage: 's3' | 'local';
  backupKey: string;
  imagekitFileId?: string;
}

function getCoversLocalDir(): string {
  const dir = join(uploadsDir, 'covers');
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  return dir;
}

function sanitizeCoverName(fileName: string): string {
  const safe = basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  if (!safe || safe === '.' || safe === '..') {
    throw new Error('Nama berkas sampul tidak valid.');
  }
  return safe;
}

/**
 * Upload book cover to ImageKit CDN (primary) and mirror a backup copy to GDriveS3
 * (with local disk fallback when S3 is disabled or unreachable).
 */
export async function uploadCoverWithBackup(
  fileName: string,
  bytes: Uint8Array,
  contentType: string = 'image/jpeg'
): Promise<CoverUploadResult> {
  const safeName = sanitizeCoverName(fileName);
  const backupKey = `covers/${safeName}`;

  // 1. Backup to GDriveS3 (or local uploads/covers fallback)
  let backupStorage: 's3' | 'local' = 'local';
  const s3 = getS3Client();
  if (s3) {
    try {
      await s3.putObject(backupKey, bytes, contentType);
      backupStorage = 's3';
    } catch (err: any) {
      console.error(`⚠️ [Cover Backup] Gagal backup ${backupKey} ke GDriveS3:`, err.message);
      await Bun.write(join(getCoversLocalDir(), safeName), bytes);
    }
  } else {
    await Bun.write(join(getCoversLocalDir(), safeName), bytes);
  }

  // 2. Primary Upload to ImageKit
  const privateKey = (process.env.IMAGEKIT_PRIVATE_KEY || '').trim();
  const skipExternal = process.env.NODE_ENV === 'test' && process.env.IMAGEKIT_ALLOW_IN_TEST !== 'true';

  if (privateKey && !skipExternal) {
    try {
      const form = new FormData();
      form.append('file', new Blob([bytes.buffer as ArrayBuffer], { type: contentType }), safeName);
      form.append('fileName', safeName);
      form.append('folder', '/novella-covers');
      form.append('useUniqueFileName', 'true');

      const authHeader = 'Basic ' + Buffer.from(`${privateKey}:`).toString('base64');
      const res = await fetch(IMAGEKIT_UPLOAD_URL, {
        method: 'POST',
        headers: { Authorization: authHeader },
        body: form,
      });

      if (res.ok) {
        const data = (await res.json()) as { url?: string; fileId?: string };
        if (data?.url) {
          return {
            url: data.url,
            provider: 'imagekit',
            backupStorage,
            backupKey,
            imagekitFileId: data.fileId,
          };
        }
      } else {
        const errText = await res.text().catch(() => '');
        console.error(`⚠️ [ImageKit Upload] HTTP ${res.status}: ${errText}`);
      }
    } catch (err: any) {
      console.error('⚠️ [ImageKit Upload] Gagal mengunggah ke ImageKit, menggunakan fallback backup:', err.message);
    }
  }

  // 3. Fallback URL served via backend /api/covers/:fileName (from GDriveS3 or local)
  return {
    url: `/api/covers/${encodeURIComponent(safeName)}`,
    provider: backupStorage === 's3' ? 'gdrives3' : 'local',
    backupStorage,
    backupKey,
  };
}

/**
 * Read backed-up cover from GDriveS3 or local disk.
 */
export async function readCoverBackup(
  fileName: string
): Promise<{ kind: 's3'; response: Response } | { kind: 'local'; file: ReturnType<typeof Bun.file> } | null> {
  const safeName = sanitizeCoverName(fileName);
  const s3 = getS3Client();
  if (s3) {
    try {
      const res = await s3.getObject(`covers/${safeName}`);
      if (res) return { kind: 's3', response: res };
    } catch {}
  }
  const localPath = join(getCoversLocalDir(), safeName);
  const file = Bun.file(localPath);
  if (await file.exists()) return { kind: 'local', file };
  return null;
}
