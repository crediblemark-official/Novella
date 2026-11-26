# Product Requirements Document (PRD)
# Katalog Buku Novella.id (`buku.novella.id`)

---

## 1. Ringkasan Produk & Tujuan

### Nama Produk
**Katalog Buku Novella.id (`buku.novella.id`)**

### Latar Belakang
Seiring bertumbuhnya jumlah karya penulis Nusantara yang diterbitkan bersama Novella.id, etalase katalog buku membutuhkan ruang khusus yang terpisah dari domain utama (`novella.id`). Domain utama `novella.id` difokuskan sebagai **Laman Landas & Portal Pemesanan Penerbitan Mandiri** bagi calon penulis, sedangkan subdomain **`buku.novella.id`** hadir sebagai **Etalase Publik & Katalog Resmi** bagi pembaca, kolektor buku indie, dan calon penulis yang ingin melihat kualitas terbitan Novella.id.

Pemisahan ini menjaga laman utama `novella.id` tetap bersih, ringan, dan berfokus pada konversi penerbitan naskah, sekaligus memberikan keleluasaan bagi `buku.novella.id` untuk berkembang sebagai katalog buku yang kaya fitur (pencarian, penyaringan genre, halaman detail sinopsis, ISBN, harga, serta tautan pemesanan langsung).

### Tujuan Utama
* **Pemisahan Domain yang Jelas:** Memisahkan aplikasi publik katalog buku ke subdomain `buku.novella.id` (`apps/katalog`) dengan navigasi silang yang mulus menuju `novella.id` dan `novella.id/portal`.
* **Eksplorasi Karya yang Mudah:** Menyediakan fitur pencarian *real-time* (judul, penulis, ISBN), filter kategori/genre, dan pengurutan buku (terbaru, judul A–Z, harga).
* **Halaman Detail & Konversi Pembelian:** Menampilkan rincian lengkap setiap buku (sampul, sinopsis, bio singkat penulis, ISBN, jumlah halaman, ukuran, tahun terbit, harga) beserta tombol **Pesan via WhatsApp Redaksi** dan tautan *marketplace* eksternal.
* **Manajemen Terpusat via Admin Redaksi:** Tim redaksi tetap mengelola seluruh data buku dari satu panel terpadu di Dashboard Admin (`novella.id/admin`), yang otomatis tersinkronisasi ke `buku.novella.id` melalui REST API.

---

## 2. Identitas Visual & Panduan Merek (Brand Guidelines)

Seluruh antarmuka `buku.novella.id` wajib menjaga konsistensi identitas visual Novella.id:

| Kategori Elemen | Spesifikasi / Nilai | Alokasi Penggunaan |
| :--- | :--- | :--- |
| **Warna Primer** | Novella Midnight Navy (`#132752`) | Header, judul buku, teks utama, tombol sekunder, footer (`#0D1C3D`) |
| **Warna Aksen** | Bookmark Spirit Orange (`#F5941E`) | Badge `KATALOG BUKU`, tombol aksi utama (CTA Pesan), harga, kategori aktif |
| **Warna Netral Utama** | Paper Pure White (`#FFFFFF`) | Latar belakang halaman katalog dan kartu buku |
| **Warna Netral Sekunder** | Soft Manuscript Gray (`#F1F5F9`) | Panel filter, input pencarian, kotak spesifikasi teknis buku |
| **Tipografi Antarmuka** | Plus Jakarta Sans (Bold, SemiBold, Medium) | Navigasi, filter, label, harga, dan tombol CTA |
| **Tipografi Sastra** | Lora (Regular, Italic) | Judul karya pada sampul generatif, sinopsis buku, dan kutipan penulis |
| **Identitas Subdomain** | Logo Novella.id + Badge `KATALOG BUKU` | Header khusus `buku.novella.id` agar pengunjung langsung mengenali ekosistem Novella.id |

---

## 3. Arsitektur & Pemisahan Domain

### Struktur Monorepo
* **`apps/frontend` (`novella.id`)**: Laman landas penerbitan, autentikasi Google/Email, Portal Kalkulator & Unggah Naskah (`/portal`), dan Dashboard Admin (`/admin`). Bagian etalase buku dihapus dari laman utama dan digantikan tautan navigasi menuju `https://buku.novella.id`.
* **`apps/katalog` (`buku.novella.id`)**: Aplikasi Astro statis mandiri khusus katalog buku. Mengonsumsi API publik dari backend Novella.id (`/api/books`, `/api/books/:slug`, `/api/settings`).
* **`apps/backend` (`api` / server utama)**: Menyediakan REST API terpusat, CORS yang mendukung subdomain `buku.novella.id`, serta dukungan *host-based routing* opsional maupun *deployment* kontainer terpisah (`Dockerfile.katalog`).

### Strategi Deployment
1. **Deployment Terpisah (Direkomendasikan):** `apps/katalog` dibangun menjadi aset statis melalui `Dockerfile.katalog` atau layanan static hosting (mis. Nginx/Caddy/Cloudflare Pages) di domain `buku.novella.id`, dengan variabel `PUBLIC_API_BASE=https://novella.id/api`.
2. **Single-Container Host Routing (Opsional):** Jika diarahkan ke kontainer backend yang sama via reverse proxy (Traefik/Dokploy), backend mendeteksi header `Host: buku.*` dan menyajikan hasil build `apps/katalog/dist`.

---

## 4. Peran Pengguna (User Roles)

### 1. Pembaca & Pengunjung Publik
* Menjelajahi katalog buku tanpa perlu login.
* Mencari buku berdasarkan judul, nama penulis, atau nomor ISBN.
* Menyaring buku berdasarkan kategori/genre dan mengurutkan daftar buku.
* Membaca sinopsis, profil penulis, dan spesifikasi cetak buku.
* Memesan buku cetak langsung ke WhatsApp Admin dengan pesan terformat otomatis atau melalui tautan *marketplace* (Shopee/Tokopedia/dll).
* Membagikan tautan langsung detail buku ke media sosial atau WhatsApp.

### 2. Calon Penulis
* Menilai kualitas cetak, ragam genre, dan karya terbitan Novella.id sebelum menerbitkan naskah sendiri.
* Mengklik banner CTA **"Terbitkan Karyamu"** yang mengarahkan langsung ke `https://novella.id/portal`.

### 3. Admin / Tim Redaksi (`novella.id/admin`)
* Menambah, menyunting (*edit*), menandai sebagai **Karya Unggulan** (*featured*), mengatur status publikasi (*draft* / terbit), dan menghapus buku pada tab **Katalog Buku**.
* Mengelola metadata lengkap: Judul, Slug URL, Nama Penulis, Bio Singkat Penulis, Kategori, Jumlah Halaman, Ukuran Buku, ISBN, Tahun Terbit, Harga (Rp), URL Sampul, Sinopsis, dan Tautan Beli Eksternal.

---

## 5. Model Data Buku (`published_books`)

| Kolom | Tipe | Wajib | Keterangan |
| :--- | :--- | :--- | :--- |
| `id` | `SERIAL (PK)` | Ya | ID unik internal |
| `slug` | `TEXT (UNIQUE)` | Ya | Slug ramah URL (otomatis dibuat dari judul jika kosong) |
| `title` | `TEXT` | Ya | Judul buku |
| `author_name` | `TEXT` | Ya | Nama penulis |
| `author_bio` | `TEXT` | Tidak | Profil singkat penulis (1–2 kalimat) |
| `category` | `TEXT` | Ya | Genre/Kategori (Novel Sastra, Kumpulan Cerpen, Antologi Puisi, Non-Fiksi, Memoar, dll.) |
| `pages` | `INTEGER` | Ya | Jumlah halaman |
| `book_size` | `TEXT` | Ya | Ukuran buku (`A5`, `Unesco`, `B5`, `A6 Saku`) |
| `isbn` | `TEXT` | Tidak | Nomor ISBN resmi (jika sudah ber-ISBN) |
| `published_year` | `INTEGER` | Tidak | Tahun terbit (mis. `2026`) |
| `price` | `INTEGER` | Tidak | Harga jual buku dalam Rupiah (mis. `65000`) |
| `cover_url` | `TEXT` | Tidak | URL gambar sampul buku; jika kosong, UI menampilkan sampul tipografi sastra generatif |
| `synopsis` | `TEXT` | Tidak | Ringkasan / sinopsis cerita atau isi buku |
| `buy_url` | `TEXT` | Tidak | Tautan eksternal toko online (Shopee, Tokopedia, dll.) |
| `is_featured` | `BOOLEAN` | Ya | Penanda buku pilihan redaksi (`default: false`) |
| `is_published` | `BOOLEAN` | Ya | Status tayang di `buku.novella.id` (`default: true`) |
| `created_at` | `TIMESTAMP` | Ya | Waktu pembuatan data |
| `updated_at` | `TIMESTAMP` | Ya | Waktu pembaruan terakhir |

---

## 6. Spesifikasi Fungsional per Modul

### Modul A — Header & Navigasi Subdomain (`buku.novella.id`)
* Logo Novella.id + lencana **`KATALOG BUKU`** yang menautkan ke beranda katalog (`/`).
* Tautan navigasi kembali ke **`Beranda Utama`** (`https://novella.id`) dan tombol CTA **`Terbitkan Naskah`** (`https://novella.id/portal`).

### Modul B — Hero Katalog & Karya Unggulan
* **Hero Ringkas:** Judul dan deskripsi singkat mengenai koleksi karya penulis Nusantara yang telah lahir di Novella.id.
* **Karya Pilihan Redaksi (*Featured*):** Menampilkan buku-buku bertanda `isFeatured = true` pada bagian sorotan di atas katalog utama (jika tersedia).

### Modul C — Pencarian, Filter & Pengurutan Katalog
* **Kotak Pencarian Real-Time:** Menyaring buku berdasarkan kecocokan teks pada *judul*, *nama penulis*, atau *ISBN*.
* **Filter Kategori (Pills):** Tombol filter dinamis berdasarkan kategori yang tersedia (`Semua`, `Novel Sastra`, `Kumpulan Cerpen`, `Antologi Puisi`, `Non-Fiksi`, dll.).
* **Pengurutan (*Sorting*):** Pilihan urut `Terbaru`, `Judul (A–Z)`, `Harga Terendah`, dan `Harga Tertinggi`.
* **Kartu Buku:**
  * Menampilkan gambar sampul (`coverUrl`) dengan rasio `3:4`, atau sampul tipografi sastra generatif (gradien Navy + font Lora) jika `coverUrl` kosong.
  * Menampilkan badge kategori, judul buku, nama penulis, ringkasan spesifikasi (`120 hal · A5`), dan harga (atau label *"Hubungi Redaksi"* jika harga belum diisi).

### Modul D — Halaman Detail Buku (`/buku?slug=...`)
* Halaman detail terpisah (`/buku?slug=<slug>`) dengan tombol **`Kembali ke Katalog`** dan **`Salin Tautan`** di bagian atas.
* **Sidebar Kiri Sticky:** Sampul *full-bleed* resolusi penuh, harga resmi, tombol **"Pesan via WhatsApp"** (mengarah ke `wa.me/<adminWa>` dengan templat pesan otomatis), tombol **"Beli di Marketplace"** (jika `buyUrl` diisi), serta tabel spesifikasi teknis (`Halaman`, `Ukuran`, `ISBN`, `Tahun Terbit`).
* **Kolom Baca Editorial:** Judul buku, nama & bio penulis, serta **Sinopsis Lengkap** multi-paragraf dengan tipografi *Lora* tanpa pemotongan maupun *modal overlay*.

### Modul E — Endpoint Backend Katalog (`apps/backend`)
* `GET /api/books` — Mendukung query opsional `?q=`, `?category=`, `?featured=true`, `?sort=newest|title|price_asc|price_desc`.
* `GET /api/books/:slugOrId` — Mengembalikan detail 1 buku terbit berdasarkan `slug` atau `id` numerik (`404` jika tidak ditemukan atau belum dipublikasikan).
* `POST /api/admin/books` — Menambah buku baru dengan validasi skema lengkap dan pembuatan `slug` otomatis.
* `PATCH /api/admin/books/:id` — Memperbarui data buku yang sudah ada.
* `DELETE /api/admin/books/:id` — Menghapus buku dari katalog.

### Modul F — Panel Manajemen Katalog di `panel.novella.id`
* Daftar tabel katalog (`/?tab=books`) dilengkapi pencarian cepat, status `Tayang` / `Draft`, tautan lihat ke `buku.novella.id/buku?slug=...`, serta tombol **Tambah**, **Edit**, dan **Hapus**.
* Halaman form terpisah (`/katalog/form` & `/katalog/form?id=...`) dengan tata letak 2 kolom asimetris, pratinjau sampul 3:4 *real-time*, label eksplisit di setiap input, dan sinopsis lengkap multi-paragraf.

---

## 7. Kebutuhan Non-Fungsional & Kriteria Penerimaan

### Kinerja & Responsivitas
* *Mobile-First Design* tanpa *horizontal scroll* mulai lebar layar `320px`.
* Halaman katalog dibangun sebagai aset statis (Astro) sehingga *First Contentful Paint* cepat (< 1,5 detik pada koneksi 4G).

### Kriteria Penerimaan (Acceptance Criteria)
```gherkin
[GIVEN] Pengunjung membuka subdomain buku.novella.id
[WHEN] Halaman selesai dimuat
[THEN] Daftar buku terbit dari /api/books tampil dalam grid responsif beserta filter kategori dan kolom pencarian

[GIVEN] Pengunjung memilih salah satu buku di katalog
[WHEN] Pengunjung mengklik kartu buku
[THEN] Detail buku terbuka menampilkan sinopsis, spesifikasi teknis (ISBN, halaman, ukuran, tahun), harga, dan tombol "Pesan via WhatsApp"

[GIVEN] Pengunjung membuka domain utama novella.id
[WHEN] Pengunjung melihat halaman beranda utama
[THEN] Etalase grid katalog tidak lagi menumpuk di beranda utama, dan tersedia tautan navigasi menuju buku.novella.id

[GIVEN] Admin redaksi membuka tab Katalog Buku di novella.id/admin
[WHEN] Admin menambah atau menyunting buku beserta sinopsis, ISBN, dan harga
[THEN] Perubahan tersimpan di PostgreSQL dan langsung muncul pada katalog di buku.novella.id
```
