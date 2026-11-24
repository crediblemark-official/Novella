import { db } from './index';
import { orders, user } from './schema';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export async function runSeed() {
  const uploadsDir = process.env.UPLOADS_DIR || join(import.meta.dir, '../../../../uploads');
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true });
  }

  // Create sample manuscript mock files
  writeFileSync(join(uploadsDir, 'lembayung_sample.docx'), 'Sample manuscript: Lembayung Jogja oleh Budi Santoso.');
  writeFileSync(join(uploadsDir, 'dapur_cerita_sample.pdf'), 'Sample manuscript: Dapur & Cerita oleh Siti Rahma.');
  writeFileSync(join(uploadsDir, 'jejak_sample.pdf'), 'Sample manuscript: Jejak Langkah oleh Ahmad R.');

  const now = new Date();

  // Clear existing to avoid duplicate on re-seed
  await db.delete(orders);
  await db.delete(user);

  // Seed sample users with Better Auth compliant schema
  await db.insert(user).values([
    {
      id: 'usr_admin_novella',
      name: 'Tim Redaksi Novella',
      email: 'admin@novella.id',
      emailVerified: true,
      image: 'AD',
      phone: '081234567890',
      address: 'Kantor Redaksi Novella.id, Maguwoharjo, Sleman, D.I. Yogyakarta',
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_budi_01',
      name: 'Budi Santoso',
      email: 'budi@example.com',
      emailVerified: true,
      image: 'BS',
      phone: '08123456789',
      address: 'Jl. Kaliurang KM 9, Sleman, D.I. Yogyakarta',
      role: 'author',
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      id: 'usr_siti_02',
      name: 'Siti Rahma',
      email: 'siti@example.com',
      emailVerified: true,
      image: 'SR',
      phone: '08567891234',
      address: 'Jl. Slamet Riyadi No. 45, Surakarta, Jawa Tengah',
      role: 'author',
      createdAt: new Date(Date.now() - 86400000 * 5),
      updatedAt: new Date(Date.now() - 86400000 * 3),
    },
    {
      id: 'usr_ahmad_03',
      name: 'Ahmad R.',
      email: 'ahmad@example.com',
      emailVerified: true,
      image: 'AR',
      phone: '08198765432',
      address: 'Kebayoran Baru, Jakarta Selatan',
      role: 'author',
      createdAt: new Date(Date.now() - 86400000 * 7),
      updatedAt: new Date(Date.now() - 86400000 * 6),
    },
  ]);

  // Seed sample orders matching PRD Table section 5 Modul F
  await db.insert(orders).values([
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
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 86400000 * 2),
    },
    {
      orderCode: 'NOV-8822',
      authorName: 'Siti Rahma',
      authorEmail: 'siti@example.com',
      authorPhone: '08567891234',
      shippingAddress: 'Jl. Slamet Riyadi No. 45, Surakarta, Jawa Tengah',
      bookTitle: 'Dapur & Cerita Rasa',
      category: 'Antologi Cerpen & Puisi',
      pages: 80,
      copies: 5,
      bookSize: 'A5',
      addons: JSON.stringify(['Layout Standar']),
      fileName: 'dapur_cerita_sample.pdf',
      fileOriginalName: 'dapur_cerita.pdf',
      fileSize: 18 * 1024,
      fileMimeType: 'application/pdf',
      totalPrice: 200000,
      status: 'Diproses',
      isRevoked: 0,
      createdAt: new Date(Date.now() - 86400000 * 4),
      updatedAt: new Date(Date.now() - 86400000 * 1),
    },
    {
      orderCode: 'NOV-8823',
      authorName: 'Ahmad R.',
      authorEmail: 'ahmad@example.com',
      authorPhone: '08198765432',
      shippingAddress: 'Kebayoran Baru, Jakarta Selatan',
      bookTitle: 'Jejak Langkah Menembus Batas',
      category: 'Kumpulan Puisi',
      pages: 150,
      copies: 20,
      bookSize: 'B5',
      addons: JSON.stringify(['ISBN Resmi', 'Cover Custom']),
      fileName: 'jejak_sample.pdf',
      fileOriginalName: 'jejak_langkah.pdf',
      fileSize: 35 * 1024,
      fileMimeType: 'application/pdf',
      totalPrice: 650000,
      status: 'Selesai',
      isRevoked: 0,
      createdAt: new Date(Date.now() - 86400000 * 6),
      updatedAt: new Date(Date.now() - 86400000 * 2),
    },
  ]);

  console.log('✅ Seed data successfully populated in PostgreSQL!');
}
