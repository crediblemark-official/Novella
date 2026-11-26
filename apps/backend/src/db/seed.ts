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
    adminWa: '6289629625458',
    companyAddress: 'Jl. Paingan (Depan Universitas Sanata Dharma), Krodan, Maguwoharjo, Depok, Sleman, D.I. Yogyakarta',
    companyTagline: 'Ruang Tumbuh Penulis Nusantara',
    bankAccounts: JSON.stringify([
      { bankName: 'Bank Central Asia (BCA)', accountNumber: '8920192831', accountHolder: 'Penerbit Novella Nusantara' },
      { bankName: 'Bank Mandiri', accountNumber: '1370018291024', accountHolder: 'Penerbit Novella Nusantara' },
    ]),
    updatedAt: now,
  });

  await db.insert(publishedBooks).values([
    {
      slug: 'lembayung-jogja',
      title: 'Lembayung Jogja',
      authorName: 'Budi Santoso',
      authorBio: 'Penulis prosa asal Sleman yang gemar merekam kisah-kisah kecil di sudut jalanan Yogyakarta.',
      category: 'Novel Sastra',
      pages: 120,
      bookSize: 'A5',
      isbn: '978-623-09-1120-1',
      publishedYear: 2026,
      price: 68000,
      synopsis:
        'Di bawah langit senja Maguwoharjo, dua sahabat lama—Raka dan Laras—bertemu kembali tanpa sengaja di sebuah kedai kopi tua di pinggir Jalan Paingan. Pertemuan itu membuka kembali lembar catatan harian bersampul cokelat yang sempat hilang sepuluh tahun silam, tepat pada malam perpisahan mereka selepas wisuda.\n\nSepanjang malam yang ditemani gerimis tipis Yogyakarta, keduanya menelusuri kembali jejak masa muda: janji-janji yang tak sempat ditepati, surat-surat yang tertahan di laci meja kos, serta keputusan sulit yang memisahkan jalan hidup mereka ke dua kota berbeda. Dari sudut alun-alun utara hingga bangku batu di tepi Selokan Mataram, setiap kenangan terasa hadir kembali seolah waktu tidak pernah benar-benar bergerak.\n\nRaka masih ingat betul bagaimana Yogyakarta saat itu menjadi saksi dari segala mimpi mereka yang sederhana: menulis naskah bersama di perpustakaan kampus, berburu buku bekas di Shopping Center Taman Pintar, dan merencanakan perjalanan lintas pulau yang tak pernah kesampaian. Bagi Raka, kepergian Laras bukan sekadar jarak geografis, melainkan ruang kosong yang ia bawa ke mana-mana bahkan setelah ia bekerja di sebuah redaksi kecil di Jakarta.\n\nSementara itu, di sudut meja kedai kopi, Laras memandangi cangkir kopi tubruknya yang mulai dingin. Selama sepuluh tahun, ia memilih tinggal di kota kelahirannya di pesisir selatan Jawa, merawat ibunya yang sakit sembari menyusun ratusan puisi yang tak pernah ia kirimkan ke media mana pun. Ia mengira waktu telah cukup lama untuk menghapus rasa bersalah, namun tatapan Raka malam itu membuktikan sebaliknya.\n\nNamun, reuni singkat itu bukan sekadar nostalgia. Di balik halaman-halaman catatan harian yang mulai menguning, tersimpan sebuah pengakuan yang selama ini disembunyikan Laras—sebuah rahasia yang menjelaskan mengapa ia pergi tanpa pamit sepuluh tahun lalu dan memilih memutus seluruh kabar. Pengakuan itu berkaitan dengan sepucuk surat penolakan, sebuah kesalahpahaman keluarga, dan pilihan pahit yang harus ia ambil demi melindungi mimpi Raka sendiri.\n\nKini, di tengah riuh kota pelajar yang telah banyak berubah, Raka harus memilih antara mempertahankan luka lama atau menerima kenyataan baru yang ditawarkan oleh masa kini. Percakapan demi percakapan mengalir jujur hingga larut malam, mengupas lapisan ego, penyesalan, dan harapan yang sempat terkubur di balik kesibukan masing-masing.\n\nKetika fajar mulai menyingsing di ufuk timur Sleman dan kereta pertama bersiap berangkat dari Stasiun Lempuyangan, keduanya akhirnya memahami bahwa tidak semua kisah harus kembali seperti semula untuk bisa selesai dengan baik. Ada pertemuan yang memang hadir hanya untuk memberi penutup yang layak.\n\nLembayung Jogja adalah novel sastra tentang ingatan, pengampunan terhadap diri sendiri, dan bagaimana sebuah kota selalu menyimpan ruang pulang bagi hati yang pernah tersesat. Ditulis dengan prosa lirih yang hangat, karya ini mengajak pembaca merenungi arti persahabatan, waktu, dan keberanian untuk berdamai dengan masa lalu.',
      isFeatured: true,
      isPublished: true,
    },
    {
      slug: 'dapur-dan-cerita',
      title: 'Dapur & Cerita',
      authorName: 'Siti Rahma',
      authorBio: 'Ibu rumah tangga dan pegiat literasi keluarga di Surakarta.',
      category: 'Kumpulan Cerpen',
      pages: 80,
      bookSize: 'A5',
      isbn: '978-623-09-1121-8',
      publishedYear: 2026,
      price: 55000,
      synopsis:
        'Dua belas cerita pendek hangat yang bertumpu pada aroma rempah, meja makan kayu jati, dan percakapan-percakapan sederhana yang menjaga ingatan lintas generasi. Dari resep sambal warisan nenek hingga kue basah subuh yang menghidupi keluarga di pinggiran Surakarta, setiap cerita berawal dari ruang paling jujur di dalam rumah.\n\nDi balik kepulan uap panci dan bunyi ulekan batu di pagi buta, tersimpan kisah tentang pengorbanan yang jarang dibicarakan: seorang ibu yang menabung dari hasil jualan serabi demi menyekolahkan anaknya ke perguruan tinggi, seorang ayah yang diam-diam belajar memasak bubur sumsum untuk istrinya yang sedang sakit, hingga seorang menantu yang belajar memahami bahasa kasih mertuanya lewat sepiring sayur lodeh.\n\nPada cerita pembuka berjudul "Garam di Ujung Sendok", pembaca diajak masuk ke dapur sempit berukuran dua kali tiga meter di kampung Laweyan, tempat seorang nenek bersikeras mempertahankan tungku kayu bakar di tengah gempuran kompor modern. Bagi sang nenek, api kayu menyimpan kesabaran yang tidak dimiliki mesin.\n\nKisah-kisah lainnya bergerak menyusuri pasar tradisional sebelum matahari terbit, warung makan pinggir stasiun, hingga ruang makan keluarga perantau di ibu kota yang merindukan rasa masakan kampung halaman setiap menjelang bulan Ramadan.\n\nSetiap kisah merayakan keteguhan para perempuan dan keluarga penjaga dapur—mereka yang diam-diam merawat kasih sayang lewat masakan hangat ketika kata-kata terasa terlalu kikuk untuk diucapkan.\n\nDapur & Cerita tidak sekadar menyajikan kisah fiksi, melainkan juga menghadirkan ruang nostalgia yang kaya rasa bagi siapa saja yang pernah merindukan masakan rumah, suara sendok beradu dengan piring, dan kehangatan keluarga.',
      isFeatured: true,
      isPublished: true,
    },
    {
      slug: 'jejak-langkah',
      title: 'Jejak Langkah',
      authorName: 'Ahmad R.',
      authorBio: 'Pelajar dan penggerak komunitas puisi muda Jakarta.',
      category: 'Antologi Puisi',
      pages: 150,
      bookSize: 'B5',
      isbn: '978-623-09-1122-5',
      publishedYear: 2025,
      price: 72000,
      synopsis:
        'Kumpulan enam puluh sajak tentang keberanian melangkah keluar dari keraguan, ditulis sepanjang perjalanan kereta komuter, bangku belakang ruang kelas, dan teras masjid sekolah. Setiap bait lahir dari pengamatan tajam seorang pelajar terhadap hiruk-pikuk kota besar dan pergulatan batin generasi seusianya.\n\nDalam bagian pertama, pembaca diajak menyusuri potret keseharian yang akrab: antrean halte di pagi hari, hujan sore di jendela kaca kelas, hingga percakapan singkat dengan pedagang kaki lima yang penuh kebijaksanaan hidup.\n\nBagian kedua menyelami ruang refleksi yang lebih sunyi tentang mimpi, kegagalan ujian, kehilangan teman seperjuangan, dan doa-doa yang dipanjatkan dalam diam sebelum fajar.\n\nDengan bahasa yang jernih dan membumi, Jejak Langkah merekam kegelisahan sekaligus optimisme generasi muda dalam menatap masa depan tanpa kehilangan akar.',
      isFeatured: false,
      isPublished: true,
    },
    {
      slug: 'senja-di-pelabuhan-kalianget',
      title: 'Senja di Pelabuhan Kalianget',
      authorName: 'Dewi Anggraini',
      authorBio: 'Mahasiswi sastra yang meneliti sejarah maritim dan cerita rakyat pesisir.',
      category: 'Novel Sastra',
      pages: 184,
      bookSize: 'Unesco',
      isbn: '978-623-09-1123-2',
      publishedYear: 2026,
      price: 79000,
      synopsis:
        'Kisah tentang surat-surat yang tak pernah dikirim dari dermaga timur Madura, merajut rindu, tradisi ladang garam, dan harapan anak-anak pesisir yang menatap cakrawala Selat Madura. Setiap senja, angin laut membawa gema kisah para pelaut yang berlayar jauh meninggalkan keluarga demi menyambung hidup.\n\nKetika sebuah arsip keluarga ditemukan di dalam peti kayu di rumah tua dekat pelabuhan, Naira—seorang mahasiswi sejarah—berupaya menyusun ulang mozaik kehidupan kakeknya sebagai nakhoda perahu layar rakyat pada era 1970-an.\n\nPenelusuran itu mempertemukannya dengan para sesepuh pelabuhan, catatan dagang lama, serta kisah cinta yang terhalang badai musim barat. Perlahan, Naira menyadari bahwa sejarah maritim bukan hanya milik buku pelajaran, melainkan hidup dalam ingatan orang-orang kecil di tepi dermaga.\n\nSenja di Pelabuhan Kalianget memadukan riset sejarah pesisir dengan kekuatan narasi sastra yang puitis, menghadirkan potret hangat masyarakat bahari Nusantara.',
      isFeatured: true,
      isPublished: true,
    },
    {
      slug: 'catatan-kaki-kampus',
      title: 'Catatan Kaki Kampus',
      authorName: 'Raka Pratama',
      authorBio: 'Dosen muda dan penulis esai pendidikan di Yogyakarta.',
      category: 'Non-Fiksi',
      pages: 140,
      bookSize: 'Unesco',
      isbn: '978-623-09-1124-9',
      publishedYear: 2025,
      price: 65000,
      synopsis:
        'Refleksi ringan seputar dunia perkuliahan, riset lapangan, bimbingan skripsi, dan panduan praktis mengubah tugas akhir akademik menjadi buku bacaan populer yang ramah bagi pembaca umum. Buku ini berangkat dari keresahan melihat ribuan karya ilmiah mahasiswa yang hanya berakhir menumpuk di gudang arsip.\n\nMelalui bab-bab yang terstruktur, penulis membagikan teknik menyederhanakan bahasa akademik yang kaku menjadi alur cerita yang mengalir tanpa mengorbankan kedalaman data dan ketajaman analisis.\n\nSelain membahas teknik penulisan, buku ini juga memuat kisah-kisah jenaka sekaligus mengharukan dari ruang konsultasi dosen dan mahasiswa tingkat akhir yang berjuang menuntaskan risetnya di tengah keterbatasan biaya.\n\nDitulis dengan gaya tutur santai namun terstruktur, Catatan Kaki Kampus menjadi teman diskusi ideal bagi mahasiswa, dosen muda, dan penulis pemula yang ingin karyanya dibaca masyarakat luas.',
      isFeatured: false,
      isPublished: true,
    },
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
