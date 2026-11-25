import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { basename, join } from 'node:path';
import { getS3Client } from './s3';

export const uploadsDir = process.env.UPLOADS_DIR || join(import.meta.dir, '../../../../uploads');

if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

export type ManuscriptReadResult =
  | { kind: 's3'; response: Response }
  | { kind: 'local'; file: ReturnType<typeof Bun.file> };

function sanitizeFileName(fileName: string): string {
  const safe = basename(fileName).trim();
  if (!safe || safe === '.' || safe === '..') {
    throw new Error('Nama berkas tidak valid.');
  }
  return safe;
}

/**
 * Save uploaded manuscript to GDriveS3 object storage when configured,
 * falling back to local filesystem so uploads stay resilient.
 */
export async function saveManuscriptFile(
  fileName: string,
  data: Uint8Array,
  contentType: string = 'application/octet-stream'
): Promise<{ storage: 's3' | 'local'; fileName: string }> {
  const safeName = sanitizeFileName(fileName);
  const s3 = getS3Client();

  if (s3) {
    try {
      await s3.putObject(safeName, data, contentType);
      return { storage: 's3', fileName: safeName };
    } catch (err: any) {
      console.error(`⚠️ [S3 Upload Fallback] Gagal upload ${safeName} ke S3, fallback ke disk lokal:`, err.message);
    }
  }

  const targetPath = join(uploadsDir, safeName);
  await Bun.write(targetPath, data);
  return { storage: 'local', fileName: safeName };
}

/**
 * Read manuscript stream from GDriveS3 or local uploads fallback.
 */
export async function readManuscriptFile(fileName: string): Promise<ManuscriptReadResult | null> {
  const safeName = sanitizeFileName(fileName);
  const s3 = getS3Client();

  if (s3) {
    try {
      const s3Res = await s3.getObject(safeName);
      if (s3Res) {
        return { kind: 's3', response: s3Res };
      }
    } catch (err: any) {
      console.error(`⚠️ [S3 Read Fallback] Gagal membaca ${safeName} dari S3:`, err.message);
    }
  }

  const filePath = join(uploadsDir, safeName);
  const file = Bun.file(filePath);
  if (await file.exists()) {
    return { kind: 'local', file };
  }

  return null;
}

/**
 * Permanently delete a manuscript file from physical storage (Hard Delete).
 * Removes from both GDriveS3 (if configured) and local filesystem.
 */
export async function deleteManuscriptFile(fileName: string | null | undefined): Promise<boolean> {
  if (!fileName) return false;

  const safeName = sanitizeFileName(fileName);
  let deleted = false;
  const s3 = getS3Client();

  if (s3) {
    try {
      const removedFromS3 = await s3.deleteObject(safeName);
      if (removedFromS3) {
        console.log(`🗑️ [S3 Hard-Delete] File ${safeName} successfully removed from S3 bucket.`);
        deleted = true;
      }
    } catch (err: any) {
      console.error(`⚠️ [S3 Delete Error] Failed to delete file ${safeName} from S3:`, err.message);
    }
  }

  const targetPath = join(uploadsDir, safeName);

  try {
    if (existsSync(targetPath)) {
      unlinkSync(targetPath);
      console.log(`🗑️ [Storage Hard-Delete] File ${safeName} successfully removed from storage.`);
      deleted = true;
    }
  } catch (err: any) {
    console.error(`⚠️ [Storage Error] Failed to delete file ${safeName}:`, err.message);
  }

  return deleted;
}

/**
 * Check if manuscript file exists in physical storage (local or S3).
 */
export function manuscriptFileExists(fileName: string | null | undefined): boolean {
  if (!fileName) return false;
  const targetPath = join(uploadsDir, sanitizeFileName(fileName));
  return existsSync(targetPath);
}

/**
 * Get physical path of uploaded manuscript.
 */
export function getManuscriptFilePath(fileName: string): string {
  return join(uploadsDir, sanitizeFileName(fileName));
}
