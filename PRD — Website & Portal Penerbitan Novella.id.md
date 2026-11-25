# Product Requirements Document (PRD)
# Website & Portal Penerbitan Novella.id

---

## 1. Ringkasan Produk & Tujuan

### Nama Produk
**Website & Portal Penerbitan Novella.id**

### Latar Belakang
Novella.id hadir sebagai mitra penerbitan karya sastra Nusantara yang inklusif dan terjangkau. Dokumen ini ditujukan untuk tim pengembang web dan tim redaksi sebagai acuan teknis dan operasional. Novella.id secara khusus merangkul dan membina kelompok penulis pemula dari berbagai segmen—termasuk pelajar, mahasiswa, ibu rumah tangga, hingga masyarakat akar rumput—agar dapat menumbuhkan keberanian menerbitkan karya tulis profesional.

Dengan penawaran paket awal yang sangat bersahabat (mulai dari Rp 150.000 untuk 5 eksemplar buku maksimal 100 halaman) serta didukung oleh layanan Customer Service yang ramah, cepat, dan sopan, Novella.id bertujuan meruntuhkan hambatan finansial dan teknis dalam dunia penerbitan mandiri.

### Tujuan Utama
* **Laman Landas Minimalis:** Menyediakan antarmuka publik yang bersih, estetis, dan minim teks guna menarik perhatian pengunjung tanpa membuat mereka merasa kewalahan oleh istilah penerbitan yang rumit.
* **Portal Pemesanan Terstruktur:** Menyediakan alur pemesanan mandiri setelah autentikasi Google, mencakup pengisian profil wajib, kalkulasi harga *real-time* (dengan validasi *server-side*), pengunggahan naskah aman, transparansi rekening pembayaran, hingga fasilitas pembatalan/penarikan naskah dengan penghapusan permanen.
* **Integrasi WhatsApp & Dashboard Admin:** Menghubungkan alur transaksi langsung ke tim redaksi melalui pesan terformat ke WhatsApp Admin serta pencatatan otomatis pada Dashboard Admin untuk manajemen pesanan secara *real-time*.

---

## 2. Identitas Visual & Panduan Merek (Brand Guidelines)

Untuk memastikan konsistensi antarmuka pengguna (UI) dan identitas merek Novella.id di seluruh platform, seluruh elemen desain wajib mengikuti standar berikut:

| Kategori Elemen | Spesifikasi / Nilai | Alokasi Penggunaan |
| :--- | :--- | :--- |
| **Warna Primer** | Novella Midnight Navy (`#132752`) | Teks utama, header, navbar, footer, dan kartu penekanan |
| **Warna Aksen** | Bookmark Spirit Orange (`#F5941E`) | Tombol aksi utama (CTA), harga aktif, badge status, dan pemicu interaktif |
| **Warna Netral Utama** | Paper Pure White (`#FFFFFF`) | Latar belakang halaman publik, area baca, dan latar kartu utama |
| **Warna Netral Sekunder** | Soft Manuscript Gray (`#F1F5F9`) | Panel form latar, pembatas section, input field, dan latar belakang tabel |
| **Tipografi Antarmuka** | Plus Jakarta Sans (Bold, SemiBold, Medium) | Seluruh judul (H1–H6), tombol CTA, label input, teks tabel, dan navigasi |
| **Tipografi Sastra** | Lora (Regular, Italic) | Kutipan sastra (quotes), kutipan testimoni, dan penulisan judul karya buku |
| **Aset Logo Horizontal Navy** | Format SVG / PNG Transparan | Penggunaan di atas latar belakang terang (Paper Pure White / Soft Gray) |
| **Aset Logo Horizontal Putih** | Format SVG / PNG Transparan | Penggunaan di atas latar belakang gelap (Midnight Navy / Footer) |
| **Aset Logo Vertikal & Ikon** | Format SVG / App Icon | Profil portal, favicon, dan avatar aplikasi (tanpa distorsi/perubahan warna) |
| **Alamat Resmi Redaksi** | Jl. Paingan (Depan Universitas Sanata Dharma), Krodan, Maguwoharjo, Depok, Sleman | Footer website, meta info portal, dan templat nota transaksi |

---

## 3. Peran Pengguna (User Roles)

### 1. Calon Penulis / Mitra Penulis (User)
* Mengakses dan mengeksplorasi Laman Landas publik.
* Melakukan autentikasi akun menggunakan Google OAuth 2.0.
* Melengkapi profil pribadi wajib (Nomor WhatsApp & Alamat Pengiriman Lengkap).
* Melakukan simulasi biaya cetak dan *add-on* penerbitan melalui Kalkulator Biaya Mandiri.
* Mengunggah dokumen naskah digital dan mengisi rincian metadata buku.
* Mengakses informasi rekening resmi dan melakukan konfirmasi pesanan ke WhatsApp Admin.
* Memantau status naskah serta menggunakan fitur **"Tarik Naskah"** (hapus permanen) selama status pesanan masih `Menunggu Verifikasi`.

### 2. Admin / Tim Redaksi (Administrator)
* Mengakses portal internal Dashboard Admin dengan hak akses khusus redaksi.
* Memantau ringkasan KPI (Total Pesanan, Status Menunggu, Total Nilai Pesanan Aktif).
* Memeriksa rincian data pemesanan dan memverifikasi pembayaran manual dari penulis.
* Mengubah status operasional naskah (`Menunggu Verifikasi` -> `Diproses` -> `Selesai`).
* Mengunduh berkas naskah penulis **hanya setelah pembayaran diverifikasi** (status `Diproses` atau `Selesai`).
* Melakukan komunikasi *follow-up* ke penulis melalui tautan pintas WhatsApp Admin.

---

## 4. Alur Pengguna End-to-End (User Flow)

Alur pengguna dirancang linear dan sistematis untuk memastikan tingkat konversi yang tinggi dan beban kognitif yang minim bagi calon penulis.

```text
[1. Laman Landas Publik]
          |
          v (Klik "Terbitkan Sekarang")
[2. Autentikasi Google OAuth 2.0]
          |
          v (Pertama Kali Login)
[3. Form Lengkapi Profil (No. HP & Alamat)]
          |
          v
[4. Kalkulator Biaya Mandiri (Portal)]
          |
          v
[5. Form Detail Buku & Unggah File Naskah ke R2]
          |
          v
[6. Halaman Pembayaran & Nomor Rekening Resmi]
          |
          v (Klik "Selesai & Konfirmasi Pesanan")
[7. Validasi Harga & Simpan di Backend] ---> [Redirect Otomatis ke WA Admin]
```

*Catatan Penting Desain:* Kalkulator Biaya Mandiri **tidak ditampilkan** pada Laman Landas publik. Hal ini bertujuan menjaga halaman depan tetap bersih, minim teks, dan fokus pada pembentukan impresi awal serta penyampaian nilai utama Novella.id.

---

## 5. Spesifikasi Fungsional per Modul

### Modul A — Laman Landas (Gaya Minim Teks)
* **Hero Section:**
  * Judul ringkas, tegas, dan menggugah semangat menulis.
  * Subjudul maksimal 1 kalimat penjelas nilai utama Novella.id.
  * Dua tombol tindakan utama: **"Terbitkan Sekarang"** (CTA utama - Orange) dan **"Cara Kerja"** (CTA sekunder - Outline Navy).
  * Elemen visual: Grafis tumpukan sampul buku sastra dalam tata letak artistik.
* **Cara Kerja (3 Langkah Ringkas):**
  1. *Masuk & Hitung:* Login Google dan tentukan spesifikasi bukumu sendiri.
  2. *Unggah Naskah:* Kirim berkas cerpen, puisi, atau novelmu dengan aman.
  3. *Bayar & Konfirmasi:* Lakukan pembayaran bersahabat dan sapa admin kami.
* **Buku yang Sudah Terbit:**
  * Tampilan *grid* 4 kartu buku terbaru.
  * Setiap kartu memuat: Gambar Sampul, Judul Buku, Genre, Jumlah Halaman, serta Nama & Profil Singkat Penulis.
* **Testimoni Penulis:**
  * 3 kartu kutipan singkat mewakili segmen pengguna utama:
    * *Pelajar:* Pengalaman menerbitkan buku antologi puisi sekolah.
    * *Mahasiswa:* Kemudahan menerbitkan tugas akhir/skripsi jadi buku ber-ISBN.
    * *Ibu Rumah Tangga:* Kebanggaan membukukan kumpulan resep dan cerita keluarga.
* **Kutipan Sastra & Footer:**
  * Kutipan sastra pendorong semangat karya tokoh sastra Nusantara.
  * Banner CTA penutup menuju portal penerbitan.
  * Footer berisi Logo Novella.id Putih, navigasi cepat, sosial media, dan Alamat Resmi Redaksi: *Jl. Paingan (Depan Universitas Sanata Dharma), Krodan, Maguwoharjo, Depok, Sleman*.

### Modul B — Autentikasi Google & Profil Penulis
* **OAuth Integration:**
  * Tombol standar **"Lanjutkan dengan Google"**.
  * Pengambilan data otomatis: Nama Lengkap, Alamat Email, dan Foto Profil.
* **Form Lengkapi Profil (Pengguna Baru):**
  * Pop-up / halaman wajib sebelum mengakses portal kalkulator jika profil belum lengkap.
  * Field 1: **Nomor HP / WhatsApp Aktif** (Validasi format nomor Indonesia `08...` atau `62...`).
  * Field 2: **Alamat Pengiriman Lengkap** (Jalan, RT/RW, Kelurahan, Kecamatan, Kota/Kabupaten, Kode Pos).

### Modul C — Kalkulator Biaya Mandiri (Di Dalam Portal)
* **Input Jumlah Halaman:**
  * Input numerik manual.
  * Tombol cepat preset: `60`, `100`, `150`, `200`, `300` halaman.
  * Tombol penyesuaian `-` dan `+`.
* **Input Jumlah Cetak (Eksemplar):**
  * Input numerik manual (Batas minimum input: `5` eksemplar).
  * Tombol cepat preset: `5`, `10`, `25`, `50`, `100` eksemplar.
* **Pilihan Ukuran Buku (Kartu Klik Selectable):**
  * `A5` ($14.8 \times 21\text{ cm}$) — Ukuran Standar Novel/Sastra.
  * `Unesco` ($15.5 \times 23\text{ cm}$) — Ukuran Populer Sastra & Non-Fiksi.
  * `B5` ($17.6 \times 25\text{ cm}$) — Ukuran Buku Ajar/Akademik.
  * `A6 Saku` ($10.5 \times 14.8\text{ cm}$) — Ukuran Buku Puisi Saku.
* **Pilihan Add-on Opsional (Toggle Switch):**
  * `ISBN Resmi & Barcode`
  * `Tata Letak (Layout) & Desain Sampul`
  * `Penyuntingan Naskah (Proofreading)`
  * `Pembatas Buku Custom`
* **Panel Ringkasan Live (Sticky Sidebar / Bottom Bar Mobile):**
  * Mengkalkulasi estimasi secara *real-time* di sisi klien untuk setiap perubahan opsi.
  * Menampilkan: Harga Dasar Cetak, Biaya Add-on, Estimasi Biaya per Buku, dan **Total Biaya Akhir**.
* **Aturan Keamanan Kalkulasi (Wajib):**
  * Nilai `TOTAL_BIAYA` yang dikirim dari frontend **tidak boleh dipercaya** oleh server. Saat pesanan disimpan, backend wajib menghitung ulang total biaya dari nol berdasarkan parameter (`halaman`, `eksemplar`, `ukuran`, `add-on`) dan tabel harga resmi di database.

### Modul D — Form Buku & Unggah Naskah
* **Metadata Buku:**
  * Field Input: **Judul Buku** (Wajib).
  * Field Input: **Kategori / Genre** (Dropdown: Novel, Antologi Puisi, Kumpulan Cerpen, Non-Fiksi, Memoar, Lainnya).
* **Upload Engine Naskah:**
  * Komponen *Drag-and-Drop* berkas.
  * Format berkas yang diterima: `.pdf`, `.doc`, `.docx`, `.txt` (validasi ekstensi dan *MIME type*).
  * Batas maksimal ukuran berkas: **50 MB**.
  * Mekanisme unggah menggunakan **Presigned URL langsung ke Cloudflare R2** (tidak melalui disk VPS) agar proses unggah stabil dan tidak membebani bandwidth server utama.
  * Indikator progres unggah dan status keberhasilan *upload*.
* **Jaminan Privasi di UI (Wajib Tampil di Bawah Kotak Drag-and-Drop):**
  * Tampilkan teks *micro-copy* dengan ikon gembok: *"Naskahmu terkunci otomatis sebelum pembayaran diverifikasi, dan akan terhapus permanen dari server jika kamu menarik naskah atau transaksi tidak dilanjutkan."*

### Modul E — Pembayaran, Konfirmasi WA & Tarik Naskah
* **Halaman Rincian Pembayaran:**
  * Ringkasan lengkap pesanan (Spesifikasi buku, jumlah cetak, add-on).
  * Tampilan visual **Nomor Rekening Resmi Novella.id** (Bank BCA / Mandiri a.n. Penerbit Novella).
  * Tombol interaktif **"Salin No. Rekening"** (dengan respons *toast feedback*).
  * Total nominal yang harus dibayar tercetak jelas dengan warna aksen Orange.
* **Disclaimer Estimasi Halaman (Di Halaman Pembayaran):**
  * Tampilkan catatan jelas di bawah Total Biaya: *"Total biaya ini adalah estimasi berdasarkan jumlah halaman yang kamu masukkan. Jika setelah verifikasi dan proses tata letak jumlah halaman melebihi batas paket, tim redaksi akan menginformasikan penyesuaian biaya melalui WhatsApp."*
* **Sistem Konfirmasi WhatsApp:**
  * Tombol **"Selesai & Konfirmasi Pesanan"**.
  * Aksi Backend: Memvalidasi ulang harga di server, lalu menyimpan seluruh record data pemesanan ke database dengan status `Menunggu Verifikasi`.
  * Aksi Frontend: Membuka jendela baru ke tautan WhatsApp API (`wa.me`) Admin dengan pesan teks terformat otomatis:

> *"Halo Admin Novella.id, saya telah membuat pesanan penerbitan naskah dengan rincian berikut:*
> * *Kode Pesanan:* `[KODE_PESANAN]`
> * *Nama Penulis:* `[NAMA_USER]`
> * *Email:* `[EMAIL_USER]`
> * *No. WhatsApp:* `[NO_HP]`
> * *Alamat Pengiriman:* `[ALAMAT]`
> * *Judul Buku:* `[JUDUL_BUKU]`
> * *Nama Berkas:* `[NAMA_FILE]`
> * *Spesifikasi:* `[HALAMAN] hal | [EXS] eks | [UKURAN]`
> * *Add-on:* `[DAFTAR_ADDON]`
> * *Total Biaya:* `[TOTAL_BIAYA]`
>
> *Mohon petunjuk untuk verifikasi pembayaran dan proses selanjutnya. Terima kasih!"*

* **Aturan Ketat "Tarik Naskah" (Hard Delete) & Auto-Expire:**
  * Penulis berhak membatalkan pesanan dan menghapus naskah secara mandiri melalui tombol **"Tarik Naskah"** (tersedia di Halaman Pembayaran dan Menu *Riwayat Naskah Saya*) **hanya selama status pesanan masih `Menunggu Verifikasi`**.
  * **Eksekusi Hard Delete Instan:** Begitu penulis mengonfirmasi **"Tarik Naskah"**, backend wajib langsung mengeksekusi penghapusan objek fisik (`DeleteObject`) pada Cloudflare R2 detik itu juga, mengubah status pesanan menjadi `Ditarik Penulis`, dan menghapus referensi path file di database.
  * **Bukti Penghapusan di UI Penulis:** Setelah penghapusan berhasil, sistem menampilkan notifikasi/riwayat bukti: *"Berkas `[NAMA_FILE]` telah dihapus permanen dari server pada `[TANGGAL & JAM WIB]`."*
  * **Auto-Delete 7 Hari (Kedaluwarsa):** Pesanan dengan status `Menunggu Verifikasi` yang tidak dibayar dalam **7 hari (168 jam)** akan otomatis dibersihkan oleh sistem (*cronjob* harian): file fisik di Cloudflare R2 dihapus permanen (`DeleteObject`) dan status pesanan berubah menjadi `Kedaluwarsa`.
  * **Kunci Pembayaran & Pembatalan:** Admin tidak dapat mengunduh naskah selama status `Menunggu Verifikasi`. Begitu Admin memverifikasi pembayaran dan mengubah status menjadi `Diproses`, tombol **"Tarik Naskah"** di akun penulis dinonaktifkan permanen dan pesanan tidak dapat dibatalkan.

### Modul F — Dashboard Admin (Internal Redaksi)
* **Kartu KPI Ringkas (Top Bar Metrics):**
  * *Total Pesanan Masuk* (Angka Kumulatif).
  * *Menunggu Verifikasi* (Pesanan butuh tindakan verifikasi pembayaran).
  * *Total Nilai Pesanan Aktif* (Nominal Rp untuk status `Diproses` & `Selesai`).
* **Tabel Pesanan Masuk (Data Grid):**

| Kode Pesanan | Identitas Penulis & Alamat | Judul Buku & Berkas | Spesifikasi & Add-on | Total Biaya | Status Pesanan | Aksi Cepat |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `NOV-8821` | **Budi Santoso**<br>`08123456789`<br>Sleman, DIY | **Lembayung Jogja**<br>`[lembayung.docx]` | 120 hal \| 10 eks \| A5<br>*Add-on: ISBN* | Rp 320.000 | `Menunggu Verifikasi` | `[Terkunci]` `[Chat WA]` |
| `NOV-8822` | **Siti Rahma**<br>`08567891234`<br>Surakarta, Jateng | **Dapur & Cerita**<br>`[dapur_cerita.pdf]` | 80 hal \| 5 eks \| A5<br>*Add-on: -* | Rp 150.000 | `Diproses` | `[Unduh]` `[Chat WA]` |
| `NOV-8823` | **Ahmad R.**<br>`08198765432`<br>Jakarta Selatan | **Jejak Langkah**<br>`[jejak.pdf]` | 200 hal \| 50 eks \| B5<br>*Add-on: Layout, ISBN* | Rp 1.450.000 | `Ditarik Penulis` | `[Berkas Dihapus]` |
| `NOV-8824` | **Rina K.**<br>`08134567890`<br>Malang, Jatim | **Senja di Kota**<br>`[senja.docx]` | 100 hal \| 5 eks \| A5<br>*Add-on: -* | Rp 150.000 | `Kedaluwarsa` | `[Berkas Dihapus]` |

* **Status & Aksi Berkas di Tabel Pesanan:**
  * `Menunggu Verifikasi`: Tombol unduh `[Terkunci]`, tombol `[Chat WA]` aktif.
  * `Diproses` / `Selesai`: Tombol `[Unduh]` aktif (via *Presigned URL* berdurasi 5 menit agar tautan tidak bisa disebarluaskan), tombol `[Chat WA]` aktif.
  * `Ditarik Penulis` / `Kedaluwarsa`: Baris bersifat *read-only*, label aksi `[Berkas Dihapus]`.
* **Kontrol Status Pesanan:**
  * Dropdown interaktif per baris tabel untuk memperbarui status: `Menunggu Verifikasi` -> `Diproses` -> `Selesai` (memerlukan konfirmasi modal saat mengubah ke `Diproses` agar tidak salah klik).
  * Pesanan berstatus `Ditarik Penulis` dan `Kedaluwarsa` bersifat *read-only* dan tidak bisa diubah lagi oleh Admin.
* **Aksi Pintas Admin:**
  * **Tombol Chat WA:** Mengarah langsung ke WhatsApp Penulis dengan teks templat salam redaksi.

---

## 6. Kebutuhan Non-Fungsional & Kriteria Penerimaan

### Desain Responsif & Kinerja
* Seluruh antarmuka portal dan laman landas wajib mengusung *Mobile-First Design*.
* Tidak boleh terjadi *horizontal scroll* pada resolusi layar perangkat seluler (lebar minimal `320px`).
* Kecepatan muat halaman (*Page Load Time*) di bawah **2,5 detik** pada koneksi 4G standar.

### Keamanan Data & Privasi Naskah
* Berkas naskah karya penulis adalah Hak Kekayaan Intelektual (HKI) yang dilindungi dan disimpan pada *private bucket* Cloudflare R2 (tidak dapat diakses lewat URL publik langsung).
* Hak akses unduh berkas secara ketat dibatasi hanya untuk:
  1. Akun Penulis pemilik naskah (selama belum ditarik/kedaluwarsa).
  2. Akun Admin Redaksi Novella.id yang terverifikasi, **hanya setelah** status pesanan `Diproses` atau `Selesai`.
* Apabila penulis memilih **"Tarik Naskah"** atau pesanan melewati batas waktu 7 hari tanpa pembayaran, sistem wajib melakukan **Hard Delete** permanen pada berkas fisik di Cloudflare R2 (bukan *soft delete*).

### Bahasa & Gaya Komunikasi Antarmuka (UX Writing)
* Bahasa yang digunakan di seluruh portal adalah **Bahasa Indonesia** yang hangat, sopan, membumi, dan komunikatif.
* Menghindari jargon teknis penerbitan yang rumit (contoh: mengganti kata *"Dummy Proofing"* menjadi *"Pratinjau Cetak Sebelum Terbit"*).

### Kriteria Penerimaan (Acceptance Criteria)
```gherkin
[GIVEN] Pengunjung berada di Laman Landas publik Novella.id
[WHEN] Pengunjung mengklik tombol "Terbitkan Sekarang" dan menyelesaikan login Google serta pengisian profil
[THEN] Pengguna diarahkan masuk ke Portal Kalkulator Biaya Mandiri

[GIVEN] Penulis berada di Portal Kalkulator
[WHEN] Penulis menginput halaman, jumlah cetak, memilih ukuran, add-on, mengunggah naskah ke R2, dan mengklik "Selesai & Konfirmasi Pesanan"
[THEN] Backend menghitung ulang total biaya secara mandiri, menyimpan pesanan dengan status "Menunggu Verifikasi" (tombol Unduh Admin terkunci), dan mengarahkan pengguna ke WhatsApp Admin dengan ringkasan pesanan lengkap

[GIVEN] Pesanan memiliki status "Menunggu Verifikasi"
[WHEN] Penulis mengklik tombol "Tarik Naskah" dan menyetujui konfirmasi
[THEN] Sistem menghapus file fisik secara permanen dari Cloudflare R2, mengubah status di Dashboard Admin menjadi "Ditarik Penulis" dengan label "Berkas Dihapus", dan menampilkan bukti waktu penghapusan di layar penulis

[GIVEN] Pesanan memiliki status "Menunggu Verifikasi" selama lebih dari 7 hari tanpa verifikasi pembayaran
[WHEN] Cronjob pembersihan harian dijalankan
[THEN] Sistem menghapus file fisik secara permanen dari Cloudflare R2 dan mengubah status pesanan menjadi "Kedaluwarsa"

[GIVEN] Admin memverifikasi pembayaran dan mengubah status pesanan dari "Menunggu Verifikasi" menjadi "Diproses"
[THEN] Tombol "Unduh" di Dashboard Admin aktif (via Presigned URL sementara 5 menit) dan tombol "Tarik Naskah" pada akun penulis otomatis dinonaktifkan
```

---

## 7. Arsitektur Teknis & Infrastruktur (Target Produksi)

Untuk menjaga performa, isolasi keamanan, dan efisiensi biaya operasional (~Rp 1,33 juta/tahun):

* **Server Aplikasi (VPS Terpisah):** VPS Linux (*root access*) spesifikasi **2 vCPU, 4 GB RAM, 60 GB Storage, 30 Mbps Egress** di region **Jakarta atau Singapura** (terpisah total dari shared hosting WordPress).
* **Tech Stack (Ringan & Cepat):**
  * **Backend API:** Bun + ElysiaJS *atau* Node.js + Hono.
  * **Frontend:** Vue 3 + Vite (di-build statis dan disajikan lewat Nginx/Caddy).
  * **Database:** PostgreSQL (atau SQLite mode WAL untuk kesederhanaan MVP) di dalam VPS.
* **Penyimpanan Berkas Naskah:** **Cloudflare R2** (*Private Bucket*, batas unggah 50 MB via *Presigned URL*) agar lalu lintas file besar tidak membebani batas 30 Mbps VPS.
* **Jaringan & Keamanan:** Cloudflare (DNS, SSL/TLS, proteksi bot dasar) di depan Reverse Proxy (Caddy/Nginx).
* **Cronjob Otomatis:**
  * **Backup Database Harian:** Menjalankan *dump* database terenkripsi ke bucket Cloudflare R2 terpisah.
  * **Pembersihan Naskah Kedaluwarsa:** Menjalankan skrip harian untuk mendeteksi pesanan `Menunggu Verifikasi` > 7 hari, mengeksekusi `DeleteObject` ke Cloudflare R2, dan memperbarui status menjadi `Kedaluwarsa`.