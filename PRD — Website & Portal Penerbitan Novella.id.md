# **Product Requirements Document (PRD)**

# **Website & Portal Penerbitan Novella.id**

# **1\. Ringkasan Produk & Tujuan**

## **Nama Produk**

**Website & Portal Penerbitan Novella.id**

## **Latar Belakang**

Novella.id hadir sebagai mitra penerbitan karya sastra Nusantara yang inklusif dan terjangkau. Dokumen ini ditujukan untuk tim pengembang web dan tim redaksi sebagai acuan teknis dan operasional. Novella.id secara khusus merangkul dan membina kelompok penulis pemula dari berbagai segmen—termasuk pelajar, mahasiswa, ibu rumah tangga, hingga masyarakat akar rumput—agar dapat menumbuhkan keberanian menerbitkan karya tulis profesional.

Dengan penawaran paket awal yang sangat bersahabat (mulai dari Rp 150.000 untuk 5 eksemplar buku maksimal 100 halaman) serta didukung oleh layanan Customer Service yang ramah, cepat, dan sopan, Novella.id bertujuan meruntuhkan hambatan finansial dan teknis dalam dunia penerbitan mandiri.

## **Tujuan Utama**

* **Laman Landas Minimalis:** Menyediakan antarmuka publik yang bersih, estetis, dan minim teks guna menarik perhatian pengunjung tanpa membuat mereka merasa kewalahan oleh istilah penerbitan yang rumit.  
* **Portal Pemesanan Terstruktur:** Menyediakan alur pemesanan mandiri setelah autentikasi Google, mencakup pengisian profil wajib, kalkulasi harga *real-time*, pengunggahan naskah aman, transparansi rekening pembayaran, hingga fasilitas pembatalan/penarikan naskah.  
* **Integrasi WhatsApp & Dashboard Admin:** Menghubungkan alur transaksi langsung ke tim redaksi melalui pesan terformat ke WhatsApp Admin serta pencatatan otomatis pada Dashboard Admin untuk manajemen pesanan secara *real-time*.

# **2\. Identitas Visual & Panduan Merek (Brand Guidelines)**

Untuk memastikan konsistensi antarmuka pengguna (UI) dan identitas merek Novella.id di seluruh platform, seluruh elemen desain wajib mengikuti standar berikut:

| Kategori Elemen | Spesifikasi / Nilai | Alokasi Penggunaan |
| :---- | :---- | :---- |
| **Warna Primer** | Novella Midnight Navy (\#132752) | Teks utama, header, navbar, footer, dan kartu penekanan |
| **Warna Aksen** | Bookmark Spirit Orange (\#F5941E) | Tombol aksi utama (CTA), harga aktif, badge status, dan pemicu interaktif |
| **Warna Netral Utama** | Paper Pure White (\#FFFFFF) | Latar belakang halaman publik, area baca, dan latar kartu utama |
| **Warna Netral Sekunder** | Soft Manuscript Gray (\#F1F5F9) | Panel form latar, pembatas section, input field, dan latar belakang tabel |
| **Tipografi Antarmuka** | Plus Jakarta Sans (Bold, SemiBold, Medium) | Seluruh judul (H1–H6), tombol CTA, label input, teks tabel, dan navigasi |
| **Tipografi Sastra** | Lora (Regular, Italic) | Kutipan sastra (quotes), kutipan testimoni, dan penulisan judul karya buku |
| **Aset Logo Horizontal Navy** | Format SVG / PNG Transparan | Penggunaan di atas latar belakang terang (Paper Pure White / Soft Gray) |
| **Aset Logo Horizontal Putih** | Format SVG / PNG Transparan | Penggunaan di atas latar belakang gelap (Midnight Navy / Footer) |
| **Aset Logo Vertikal & Ikon** | Format SVG / App Icon | Profil portal, favicon, dan avatar aplikasi (tanpa distorsi/perubahan warna) |
| **Alamat Resmi Redaksi** | Jl. Paingan (Depan Universitas Sanata Dharma), Krodan, Maguwoharjo, Depok, Sleman | Footer website, meta info portal, dan templat nota transaksi |

# **3\. Peran Pengguna (User Roles)**

## **1\. Calon Penulis / Mitra Penulis (User)**

* Mengakses dan mengeksplorasi Laman Landas publik.  
* Melakukan autentikasi akun menggunakan Google OAuth 2.0.  
* Melengkapi profil pribadi wajib (Nomor WhatsApp & Alamat Pengiriman Lengkap).  
* Simulasi biaya cetak dan *add-on* penerbitan melalui Kalkulator Biaya Mandiri.  
* Mengunggah dokumen naskah digital dan mengisi rincian metadata buku.  
* Mengakses informasi rekening resmi dan melakukan konfirmasi pesanan ke WhatsApp Admin.  
* Memantau status naskah serta melakukan fitur "Tarik Naskah" selama naskah belum diverifikasi redaksi.

## **2\. Admin / Tim Redaksi (Administrator)**

* Mengakses portal internal Dashboard Admin dengan hak akses khusus redaksi.  
* Memantau ringkasan KPI (Total Pesanan, Status Menunggu, Nilai Pesanan).  
* Memeriksa rincian data pemesanan dan mengunduh berkas naskah yang diunggah penulis.  
* Mengubah status operasional naskah (*Menunggu Verifikasi* \$\\rightarrow\$ *Diproses* \$\\rightarrow\$ *Selesai* / *Ditarik Penulis*).  
* Melakukan komunikasi follow-up ke penulis melalui tautan pintas WhatsApp Admin.

# **4\. Alur Pengguna End-to-End (User Flow)**

Alur pengguna dirancang linear dan sistematis untuk memastikan tingkat konversi yang tinggi dan beban kognitif yang minim bagi calon penulis.

```
[1. Laman Landas Publik]
          │
          ▼ (Klik "Terbitkan Sekarang")
[2. Autentikasi Google OAuth 2.0]
          │
          ▼ (Pertama Kali Login)
[3. Form Lengkapi Profil (No. HP & Alamat)]
          │
          ▼
[4. Kalkulator Biaya Mandiri (Portal)]
          │
          ▼
[5. Form Detail Buku & Unggah File Naskah]
          │
          ▼
[6. Halaman Pembayaran & Nomor Rekening Resmi]
          │
          ▼ (Klik "Selesai / Konfirmasi")
[7. Simpan Data ke Backend/Admin] ───► [Redirect Otomatis ke WA Admin]
```

*Catatan Penting Desain:* Kalkulator Biaya Mandiri **tidak ditampilkan** pada Laman Landas publik. Hal ini bertujuan menjaga halaman depan tetap bersih, minim teks, dan fokus pada pembentukan impresi awal serta penyampaian nilai utama Novella.id.

# **5\. Spesifikasi Fungsional per Modul**

# **Modul A — Laman Landas (Gaya Minim Teks)**

* **Hero Section:**  
  * Judul ringkas, tegas, dan menggugah semangat menulis.  
  * Subjudul maksimal 1 kalimat penjelas nilai utama Novella.id.  
  * Dua tombol tindakan utama: **"Terbitkan Sekarang"** (CTA utama \- Orange) dan **"Cara Kerja"** (CTA sekunder \- Outline Navy).  
  * Elemen visual: Grafis tumpukan sampul buku sastra dalam tata letak artistik.  
* **Cara Kerja (3 Langkah Ringkas):**  
  1. *Masuk & Hitung:* Login Google dan tentukan spesifikasi bukumus sendiri.  
  2. *Unggah Naskah:* Kirim berkas cerpen, puisi, atau novelmu dengan aman.  
  3. *Bayar & Konfirmasi:* Lakukan pembayaran bersahabat dan sapa admin kami.  
* **Buku yang Sudah Terbit:**  
  * Tampilan *grid* 4 kartu buku terbaru.  
  * Setiap kartu memuat: Gambar Sampul, Judul Buku, Genre, Jumlah Halaman, serta Nama & Profil Singkat Penulis.  
* **Testimoni Penulis:**  
  * 3 kartu kutipan singkat mewakili segmen pengguna utama:  
    * *Pelajar:* Pengalaman menerbitkan buku antologi puisi sekolah.  
    * *Mahasiswa:* Kemudahan menerbitkan tugas akhir/skripsi jadi buku ber-ISBN.  
    * *Ibu Rumah Tangan:* Kebanggaan membukukan kumpulan resep dan cerita keluarga.  
* **Kutipan Sastra & Footer:**  
  * Kutipan sastra pendorong semangat karya tokoh sastra Nusantara.  
  * Banner CTA penutup menuju portal penerbitan.  
  * Footer berisi Logo Novella.id Putih, navigasi cepat, sosial media, dan Alamat Resmi Redaksi: *Jl. Paingan (Depan Universitas Sanata Dharma), Krodan, Maguwoharjo, Depok, Sleman*.

# **Modul B — Autentikasi Google & Profil Penulis**

* **OAuth Integration:**  
  * Tombol standar "Lanjutkan dengan Google".  
  * Pengambilan data otomatis: Nama Lengkap, Alamat Email, dan Foto Profil.  
* **Form Lengkapi Profil (Pengguna Baru):**  
  * Pop-up / Halaman wajib sebelum mengakses portal kalkulator jika profil belum lengkap.  
  * Field 1: **Nomor HP / WhatsApp Aktif** (Validasi format nomor Indonesia `08...` atau `62...`).  
  * Field 2: **Alamat Pengiriman Lengkap** (Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos).

# **Modul C — Kalkulator Biaya Mandiri (Di Dalam Portal)**

* **Input Jumlah Halaman:**  
  * Input numerik manual.  
  * Tombol cepat preset: `60`, `100`, `150`, `200`, `300` halaman.  
  * Tombol penyesuaian `-` dan `+`.  
* **Input Jumlah Cetak (Eksemplar):**  
  * Input numerik manual (Batas minimum input: 5 eksemplar).  
  * Tombol cepat preset: `5`, `10`, `25`, `50`, `100` eksemplar.  
* **Pilihan Ukuran Buku (Kartu Klik Selectable):**  
  * `A5` (14.8 x 21 cm) — Ukuran Standar Novel/Sastra.  
  * `Unesco` (15.5 x 23 cm) — Ukuran Populer Sastra & Non-Fiksi.  
  * `B5` (17.6 x 25 cm) — Ukuran Buku Ajar/Akademik.  
  * `A6 Saku` (10.5 x 14.8 cm) — Ukuran Buku Puisi Saku.  
* **Pilihan Add-on Opsional (Toggle Switch):**  
  * `ISBN Resmi & Barcode`  
  * `Tata Letak (Layout) & Desain Sampul`  
  * `Penyuntingan Naskah (Proofreading)`  
  * `Pembatas Buku Custom`  
* **Panel Ringkasan Live (Sticky Sidebar / Bottom Bar Mobile):**  
  * Mengkalkulasi secara *real-time* perubahan setiap opsi.  
  * Menampilkan: Harga Dasar Cetak, Biaya Add-on, Estimasi Biaya per Buku, dan **Total Biaya Akhir**.

# **Modul D — Form Buku & Unggah Naskah**

* **Metadata Buku:**  
  * Field Input: **Judul Buku** (Wajib).  
  * Field Input: **Kategori / Genre** (Dropdown: Novel, Antologi Puisi, Kumpulan Cerpen, Non-Fiksi, Memoar, Lainnya).  
* **Upload Engine Naskah:**  
  * Komponen *Drag-and-Drop* berkas.  
  * Format berkas yang diterima: `.pdf`, `.doc`, `.docx`, `.txt`.  
  * Batas maksimal ukuran berkas: 50 MB.  
  * Indikator progres unggah dan status keberhasilan *upload*.

# **Modul E — Pembayaran, Konfirmasi WA & Tarik Naskah**

* **Halaman Rincian Pembayaran:**  
  * Ringkasan lengkap pesanan (Spesifikasi buku, jumlah cetak, add-on).  
  * Tampilan visual **Nomor Rekening Resmi Novella.id** (Bank BCA / Mandiri a.n. Penerbit Novella).  
  * Tombol interaktif **"Salin No. Rekening"** (dengan respons *toast feedback*).  
  * Total nominal yang harus dibayar tercetak jelas dengan warna aksen Orange.  
* **Sistem Konfirmasi WhatsApp:**  
  * Tombol **"Selesai & Konfirmasi Pesanan"**.  
  * Aksi Backend: Menyimpan seluruh record data pemesanan ke database dengan status `Menunggu Verifikasi`.  
  * Aksi Frontend: Membuka jendela baru ke tautan WhatsApp API (`wa.me`) Admin dengan pesan teks terformat otomatis:

*"Halo Admin Novella.id, saya telah membuat pesanan penerbitan naskah dengan rincian berikut:*

* *Kode Pesanan:* `[KODE_PESANAN]`  
* *Nama Penulis:* `[NAMA_USER]`  
* *Email:* `[EMAIL_USER]`  
* *No. WhatsApp:* `[NO_HP]`  
* *Alamat Pengiriman:* `[ALAMAT]`  
* *Judul Buku:* `[JUDUL_BUKU]`  
* *Nama Berkas:* `[NAMA_FILE]`  
* *Spesifikasi:* `[HALAMAN] hal | [EXS] eks | [UKURAN]`  
* *Add-on:* `[DAFTAR_ADDON]`  
* *Total Biaya:* `[TOTAL_BIAYA]`

*Mohon petunjuk untuk verifikasi pembayaran dan proses selanjutnya. Terima kasih\!"*

* **Fitur "Tarik Naskah":**  
  * Penulis diberikan hak membatalkan pesanan dan menarik kembali dokumen naskah secara mandiri.  
  * Tombol **"Tarik Naskah"** tersedia di Halaman Pembayaran dan Menu *Riwayat Naskah Saya*.  
  * Syarat: Hanya berlaku jika status pesanan masih `Menunggu Verifikasi`.  
  * Efek Sistem: Status pesanan otomatis berubah menjadi `Ditarik Penulis` pada Dashboard Admin, akses unduh berkas naskah bagi redaksi ditutup, dan status berkas ditandai *Revoked*.  
  * Admin tidak dapat mengunduh naskah untuk dikirim cetak kecuali pembayaran sudah diverifikasi.   
  * Jika sudah di verifikasi maka pesanan tidak bisa dibatalkan.

# **Modul F — Dashboard Admin (Internal Redaksi)**

* **Kartu KPI Ringkas (Top Bar Metrics):**  
  * *Total Pesanan Masuk* (Angka Kumulatif).  
  * *Menunggu Verifikasi* (Pesanan butuh tindakan).  
  * *Total Nilai Pesanan Aktif* (Nominal Rp).  
* **Tabel Pesanan Masuk (Data Grid):**

| Kode Pesanan | Identitas Penulis & Alamat | Judul Buku & Berkas | Spesifikasi & Add-on | Total Biaya | Status Pesanan | Aksi Cepat |
| :---- | :---- | :---- | :---- | :---- | :---- | :---- |
| `NOV-8821` | **Budi Santoso**`08123456789`Sleman, DIY | **Lembayung Jogja**`[lembayung.docx]` | 120 hal \| 10 eks \| A5*Add-on: ISBN* | Rp 320.000 | `Menunggu Verifikasi` | \[Unduh\] \[Chat WA\] |
| `NOV-8822` | **Siti Rahma**`08567891234`Surakarta, Jateng | **Dapur & Cerita**`[dapur_cerita.pdf]` | 80 hal \| 5 eks \| A5*Add-on: \-* | Rp 150.000 | `Diproses` | \[Unduh\] \[Chat WA\] |
| `NOV-8823` | **Ahmad R.**`08198765432`Jakarta Selatan | **Jejak Langkah**`[jejak.pdf]` | 200 hal \| 50 eks \| B5*Add-on: Layout, ISBN* | Rp 1.450.000 | `Ditarik Penulis` | \[Berkas Dikunci\] |

* **Kontrol Status Pesanan:**  
  * Dropdown interaktif per baris tabel untuk memperbarui status pesanan: `Menunggu Verifikasi` \$\\rightarrow\$ `Diproses` \$\\rightarrow\$ `Selesai`.  
* **Aksi Pintas Admin:**  
  * Tombol **Unduh File Naskah** (Aktif hanya jika status bukan *Ditarik Penulis*).  
  * Tombol **Chat WA** yang mengarah langsung ke WhatsApp Penulis dengan teks templat salam redaksi.

# **6\. Kebutuhan Non-Fungsional & Kriteria Penerimaan**

## **Desain Responsif & Kinerja**

* Seluruh antarmuka portal dan laman landas wajib mengusung *Mobile-First Design*.  
* Tidak boleh terjadi *horizontal scroll* pada resolusi layar perangkat seluler (lebar minimal 320px).  
* Kecepatan muat halaman (Page Load Time) di bawah 2.5 detik pada koneksi 4G standar.

## **Keamanan Data & Privasi Naskah**

* Berkas naskah karya penulis adalah Hak Kekayaan Intelektual (HKI) yang dilindungi.  
* Hak akses unduh berkas secara ketat dibatasi hanya untuk:  
  1. Akun Penulis pemilik naskah.  
  2. Akun Admin Redaksi Novella.id yang terverifikasi.  
* Apabila penulis memilih **"Tarik Naskah"**, sistem secara otomatis mencabut otorisasi unduh berkas dari Dashboard Admin dan menandai naskah sebagai berkas tidak aktif (*Soft Delete / Access Revoked*).

## **Bahasa & Gaya Komunikasi Antarmuka (UX Writing)**

* Bahasa yang digunakan di seluruh portal adalah **Bahasa Indonesia** yang hangat, sopan, membumi, dan komunikatif.  
* Menghindari jargon teknis penerbitan yang rumit (contoh: mengganti kata *"Dummy Proofing"* menjadi *"Prinjinjau Cetak Sebelum Terbit"*).

## **Kriteria Penerimaan (Acceptance Criteria)**

```
[GIVEN] Pengunjung berada di Laman Landas publik Novella.id
[WHEN] Pengunjung mengklik tombol "Terbitkan Sekarang" dan menyelesaikan login Google serta pengisian profil
[THEN] Pengguna diarahkan masuk ke Portal Kalkulator Biaya Mandiri

[GIVEN] Penulis berada di Portal Kalkulator
[WHEN] Penulis menginput halaman, jumlah cetak, memilih ukuran, add-on, mengunggah naskah, dan mengklik "Selesai & Konfirmasi"
[THEN] Data pesanan tersimpan di backend dengan status "Menunggu Verifikasi", tampil di Dashboard Admin, dan pengguna langsung di-redirect ke aplikasi WhatsApp Admin dengan format pesan ringkasan pesanan lengkap

[GIVEN] Pesanan memiliki status "Menunggu Verifikasi"
[WHEN] Penulis mengklik tombol "Tarik Naskah" di portal akun mereka
[THEN] Status pesanan di Dashboard Admin berubah real-time menjadi "Ditarik Penulis" dan tombol unduh naskah bagi Admin otomatis dinonaktifkan
```

