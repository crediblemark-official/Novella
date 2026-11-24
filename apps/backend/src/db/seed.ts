import { db } from './index';
import { orders, users } from './schema';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export function runSeed() {
  const uploadsDir = join(import.meta.dir, '../../uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  // Create sample manuscript mock files
  writeFileSync(join(uploadsDir, 'lembayung_sample.docx'), 'Sample manuscript: Lembayung Jogja oleh Budi Santoso.');
  writeFileSync(join(uploadsDir, 'dapur_cerita_sample.pdf'), 'Sample manuscript: Dapur & Cerita oleh Siti Rahma.');
  writeFileSync(join(uploadsDir, 'jejak_sample.pdf'), 'Sample manuscript: Jejak Langkah oleh Ahmad R.');

  const now = Date.now();

  // Clear existing to avoid duplicate on re-seed
  db.delete(orders).run();
  db.delete(users).run();

  // Seed sample users
  db.insert(users).values([
    {
      name: 'Budi Santoso',
      email: 'budi@example.com',
      avatar: 'BS',
      phone: '08123456789',
      address: 'Jl. Kaliurang KM 9, Sleman, D.I. Yogyakarta',
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
    },
    {
      name: 'Siti Rahma',
      email: 'siti@example.com',
      avatar: 'SR',
      phone: '08567891234',
      address: 'Jl. Slamet Riyadi No. 45, Surakarta, Jawa Tengah',
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 3,
    },
    {
      name: 'Ahmad R.',
      email: 'ahmad@example.com',
      avatar: 'AR',
      phone: '08198765432',
      address: 'Kebayoran Baru, Jakarta Selatan',
      createdAt: now - 86400000 * 7,
      updatedAt: now - 86400000 * 6,
    },
  ]).run();

  // Seed sample orders matching PRD Table section 5 Modul F
  db.insert(orders).values([
    {
      orderCode: 'NOV-8821',
      authorName: 'Budi Santoso',
      authorEmail: 'budi@example.com',
      authorPhone: '08123456789',
      shippingAddress: 'Jl. Kaliurang KM 9, Sleman, D.I. Yogyakarta',
      bookTitle: 'Lembayung Jogja',
      category: 'Novel',
      pages: 120,
      copies: 10,
      bookSize: 'A5',
      addons: JSON.stringify(['ISBN Resmi']),
      fileName: 'lembayung_sample.docx',
      fileOriginalName: 'lembayung.docx',
      fileSize: 42 * 1024,
      fileMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      totalPrice: 320000,
      status: 'Menunggu Verifikasi',
      isRevoked: 0,
      createdAt: now - 86400000 * 2,
      updatedAt: now - 86400000 * 2,
    },
    {
      orderCode: 'NOV-8822',
      authorName: 'Siti Rahma',
      authorEmail: 'siti@example.com',
      authorPhone: '08567891234',
      shippingAddress: 'Jl. Slamet Riyadi No. 45, Surakarta, Jawa Tengah',
      bookTitle: 'Dapur & Cerita',
      category: 'Kumpulan Cerpen',
      pages: 80,
      copies: 5,
      bookSize: 'A5',
      addons: JSON.stringify([]),
      fileName: 'dapur_cerita_sample.pdf',
      fileOriginalName: 'dapur_cerita.pdf',
      fileSize: 128 * 1024,
      fileMimeType: 'application/pdf',
      totalPrice: 150000,
      status: 'Diproses',
      isRevoked: 0,
      createdAt: now - 86400000 * 5,
      updatedAt: now - 86400000 * 3,
    },
    {
      orderCode: 'NOV-8823',
      authorName: 'Ahmad R.',
      authorEmail: 'ahmad@example.com',
      authorPhone: '08198765432',
      shippingAddress: 'Kebayoran Baru, Jakarta Selatan',
      bookTitle: 'Jejak Langkah',
      category: 'Antologi Puisi',
      pages: 200,
      copies: 50,
      bookSize: 'B5',
      addons: JSON.stringify(['Layout & Sampul', 'ISBN Resmi']),
      fileName: 'jejak_sample.pdf',
      fileOriginalName: 'jejak.pdf',
      fileSize: 256 * 1024,
      fileMimeType: 'application/pdf',
      totalPrice: 1450000,
      status: 'Ditarik Penulis',
      isRevoked: 1, // Access Revoked
      createdAt: now - 86400000 * 7,
      updatedAt: now - 86400000 * 6,
    },
  ]).run();

  console.log('✅ Seed data successfully populated!');
}

if (import.meta.main) {
  runSeed();
}
