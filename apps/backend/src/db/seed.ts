import { db } from './index';
import { orders, user, settings, publishedBooks, testimonials } from './schema';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export async function runSeed() {
  const uploadsDir = process.env.UPLOADS_DIR || join(import.meta.dir, '../../../../uploads');
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

  writeFileSync(join(uploadsDir, 'lembayung_sample.docx'), 'Sample manuscript: Lembayung Jogja');
  writeFileSync(join(uploadsDir, 'dapur_cerita_sample.pdf'), 'Sample manuscript: Dapur & Cerita');
  writeFileSync(join(uploadsDir, 'jejak_sample.pdf'), 'Sample manuscript: Jejak Langkah');

  const now = new Date();
  await db.delete(orders);
  await db.delete(user);
  await db.delete(settings);
  await db.delete(publishedBooks);
  await db.delete(testimonials);

  await db.insert(user).values([
    {
      id: 'usr_admin_novella',
      name: 'Tim Redaksi Novella',
      email: 'admin@novella.id',
      emailVerified: true,
      image: 'AD',
      phone: '081995100401',
      address: 'Kantor Redaksi Novella.id, Paingan, Maguwoharjo, Sleman, D.I. Yogyakarta',
      role: 'admin',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'usr_rasyiqi_novella',
      name: 'Info rasyiqi',
      email: 'info.rasyiqi@gmail.com',
      emailVerified: true,
      image: 'IR',
      phone: '081995100401',
      address: 'Sumenep',
      role: 'author',
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
  ]);

  await db.insert(settings).values({
    adminWa: '6281995100401',
    companyAddress: 'Jl. Paingan (Depan Universitas Sanata Dharma), Krodan, Maguwoharjo, Depok, Sleman, D.I. Yogyakarta',
    companyTagline: 'Mitra Penerbitan Sastra Nusantara Terpercaya',
    bankAccounts: JSON.stringify([
      { bankName: 'Bank Central Asia (BCA)', accountNumber: '8920192831', accountHolder: 'Penerbit Novella Nusantara' },
      { bankName: 'Bank Mandiri', accountNumber: '1370018291024', accountHolder: 'Penerbit Novella Nusantara' },
    ]),
    updatedAt: now,
  });

  await db.insert(publishedBooks).values([
    { title: 'Lembayung Jogja', authorName: 'Budi Santoso', category: 'Novel Sastra', pages: 120, bookSize: 'A5', isPublished: true },
    { title: 'Dapur & Cerita', authorName: 'Siti Rahma', category: 'Kumpulan Cerpen', pages: 80, bookSize: 'A5', isPublished: true },
    { title: 'Jejak Langkah', authorName: 'Ahmad R.', category: 'Antologi Puisi', pages: 150, bookSize: 'B5', isPublished: true },
  ]);

  await db.insert(testimonials).values([
    { authorName: 'Ahmad R.', roleOrCity: 'Pelajar SMA, Jakarta', quote: 'Di Novella.id cuma Rp 150 ribu sudah dapat 5 eksemplar, adminnya ramah banget membantu!', rating: 5, isActive: true },
    { authorName: 'Dewi Anggraini', roleOrCity: 'Mahasiswi Sastra, Yogyakarta', quote: 'Proses mandirinya cepat, kalkulatornya transparan dan ada opsi ISBN resmi.', rating: 5, isActive: true },
    { authorName: 'Siti Rahma', roleOrCity: 'Ibu Rumah Tangga, Surakarta', quote: 'Akhirnya bisa menghadiahkan buku cetak berwujud nyata untuk anak cucu.', rating: 5, isActive: true },
  ]);

  await db.insert(orders).values([
    {
      orderCode: 'NOV-8821',
      authorName: 'Budi Santoso',
      authorEmail: 'budi@example.com',
      authorPhone: '08123456789',
      shippingAddress: 'Jl. Kaliurang KM 9, Sleman, D.I. Yogyakarta',
      bookTitle: 'Lembayung Jogja',
      category: 'Novel Sastra',
      pages: 100,
      copies: 5,
      bookSize: 'A5',
      addons: JSON.stringify([]),
      fileName: 'lembayung_sample.docx',
      fileOriginalName: 'lembayung.docx',
      fileSize: 24 * 1024,
      fileMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      totalPrice: 150000,
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
      bookTitle: 'Dapur & Cerita',
      category: 'Kumpulan Cerpen',
      pages: 100,
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
      shippingCourier: 'JNE',
      shippingTrackingNumber: 'JNE123456789',
      createdAt: new Date(Date.now() - 86400000 * 4),
      updatedAt: new Date(Date.now() - 86400000 * 1),
    },
  ]);

  console.log('✅ Seed data successfully populated in PostgreSQL!');
}
