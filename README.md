# Novella.id — Website & Portal Penerbitan Karya Sastra Nusantara

Platform penerbitan karya sastra Nusantara yang inklusif, ramah, dan transparan. Dibangun dengan standar arsitektur modern berkinerja tinggi: **Astro** (Frontend) dan **Elysia.js + Bun Runtime** (Backend).

---

## 🚀 Arsitektur & Teknologi (Bun Monorepo)

```text
novella.id/
├── apps/
│   ├── frontend/                  # Astro v5 + Tailwind CSS v4
│   │   ├── src/
│   │   │   ├── layouts/           # BaseLayout (Nav, Footer Resmi, Brand Fonts)
│   │   │   ├── pages/
│   │   │   │   ├── index.astro    # Laman Landas Publik (Minimalis, Zero-JS)
│   │   │   │   ├── portal.astro   # Portal Pemesanan & Kalkulator Mandiri
│   │   │   │   └── admin.astro    # Dashboard Internal Redaksi (KPI & Verifikasi)
│   │   │   └── styles/            # global.css (Tailwind v4 theme tokens)
│   │   └── astro.config.mjs
│   │
│   └── backend/                   # Elysia.js + Bun Runtime
│       ├── src/
│       │   ├── db/                # Drizzle ORM (Zero-FK pattern, Bun SQLite)
│       │   ├── modules/
│       │   │   ├── auth/          # Google Sign-In & Profile Completion
│       │   │   ├── orders/        # Pricing Engine, Order Submission, Tarik Naskah
│       │   │   ├── upload/        # Safe File Upload Engine (max 50 MB, .pdf/.docx/.txt)
│       │   │   └── admin/         # KPI Metrics & Gated File Access
│       │   └── index.ts           # Elysia Server (CORS, Swagger at /swagger)
│       └── uploads/               # Penyimpanan berkas naskah digital
│
├── package.json                   # Root Bun Workspace
└── PRD — Website & Portal Penerbitan Novella.id.md
```

---

## 🎨 Identitas Visual & Panduan Merek

| Elemen | Nilai / Spesifikasi | Implementasi |
| :--- | :--- | :--- |
| **Warna Primer** | Novella Midnight Navy (`#132752`) | Teks utama, navbar, kartu penekanan |
| **Warna Aksen** | Bookmark Spirit Orange (`#F5941E`) | Tombol aksi utama (CTA), badge harga aktif |
| **Warna Netral** | Paper Pure White (`#FFFFFF`) & Soft Manuscript Gray (`#F1F5F9`) | Latar halaman publik, form panel |
| **Tipografi** | Plus Jakarta Sans & Lora (Sastra) | Antarmuka pengguna & kutipan karya |
| **Alamat Resmi** | Jl. Paingan (Depan USD), Krodan, Maguwoharjo, Depok, Sleman | Footer website & nota transaksi |

---

## ⚙️ Cara Menjalankan Aplikasi

### 1. Prasyarat
- [Bun](https://bun.sh) (v1.2+)

### 2. Instalasi Dependensi
```bash
bun install
```

### 3. Jalankan Server Pengembangan (Dev)
Menjalankan frontend dan backend secara bersamaan:
```bash
bun run dev
```

Atau jalankan masing-masing di terminal terpisah:
```bash
# Terminal 1: Backend Elysia (Port 3001)
bun run dev:backend

# Terminal 2: Frontend Astro (Port 4321)
bun run dev:frontend
```

Buka di peramban:
- **Laman Landas Publik**: [http://localhost:4321](http://localhost:4321)
- **Portal Pemesanan Mandiri**: [http://localhost:4321/portal](http://localhost:4321/portal)
- **Dashboard Redaksi (Admin)**: [http://localhost:4321/admin](http://localhost:4321/admin)
- **Dokumentasi API Swagger**: [http://localhost:3001/swagger](http://localhost:3001/swagger)

---

## 🧪 Uji Mutu & Quality Gates

```bash
# Jalankan seluruh unit test & integration test E2E backend
bun test

# Pemeriksaan tipe (TypeScript strict)
bun run typecheck

# Build produksi frontend Astro
bun run build
```

---

## ✨ Fitur Unggulan Sesuai PRD

1. **Laman Landas Minimalis**: Bersih, memikat, dan minim teks untuk mengurangi beban kognitif penulis pemula.
2. **Kalkulator Biaya Mandiri Real-Time**: Simulasi halaman (24–600), eksemplar (5–1000), 4 pilihan ukuran buku (A5, Unesco, B5, A6), dan add-on transparan.
3. **Upload Engine Naskah Aman**: Validasi format (`.pdf`, `.doc`, `.docx`, `.txt`) dan pembatasan berkas hingga 50 MB.
4. **Integrasi WhatsApp Otomatis**: Menghasilkan tautan pesan terformat rapi langsung ke WhatsApp Admin Redaksi.
5. **Fitur "Tarik Naskah" (Penarikan Mandiri)**: Hak penulis membatalkan pesanan sebelum diverifikasi redaksi. Sistem secara otomatis mengubah status menjadi `Ditarik Penulis` dan mengunci akses unduh berkas bagi redaksi (*Access Revoked*).
6. **Dashboard Admin Internal Redaksi**: Pemantauan KPI (*Total Pesanan, Menunggu Verifikasi, Total Nilai Aktif*), kontrol status naskah, dan tombol follow-up WhatsApp langsung ke penulis.
