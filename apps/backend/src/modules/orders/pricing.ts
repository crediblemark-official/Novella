export interface PricingParams {
  pages: number;
  copies: number;
  bookSize: 'A5' | 'Unesco' | 'B5' | 'A6 Saku' | 'A6' | 'A4' | string;
  addons: string[];
  printType?: 'BW' | 'FC' | string;
  coverType?: 'Soft Cover' | 'Hard Cover' | string;
}

export interface PricingResult {
  basePrice: number;
  extraCopies: number;
  extraPages: number;
  sizeCost: number;
  addonsCost: number;
  totalPrice: number;
  pricePerBook: number;
  details: {
    baseCopies: number;
    basePages: number;
    sizeName: string;
    addonItems: { name: string; price: number }[];
    standardSpecs: string;
  };
}

export const BASE_PRICE = 150_000;
export const BASE_COPIES = 5;
export const BASE_PAGES = 100;
export const STANDARD_SPECS = 'Soft Cover Ivory 230/260 gr, Lem Panas Kuat, Bookmark, Wrapping & Packing';

// Matriks Resmi Tarif Cetak per Halaman Novella.id
export const NOVELLA_PRINT_RATES = {
  BW: {
    'A6': { standard: 130, premium: 130 },
    'A5': { standard: 250, premium: 275 },
    'Unesco': { standard: 250, premium: 275 },
    'B5': { standard: 400, premium: 420 },
    'A4': { standard: 400, premium: 420 },
  },
  FC: {
    'A6': { standard: 350, premium: 350 },
    'A5': { standard: 520, premium: 550 },
    'Unesco': { standard: 520, premium: 550 },
    'B5': { standard: 1050, premium: 1100 },
    'A4': { standard: 1050, premium: 1100 },
  },
};

// Tarif Finishing Hard Cover (1 - 500 Halaman)
export const HARD_COVER_RATES: Record<string, number> = {
  'A5': 25_000,
  'Unesco': 35_000,
  'B5': 45_000,
  'A4': 45_000,
};

export const BOOK_SIZES: Record<string, { label: string; dimension: string; ratePerCopy: number }> = {
  'A5': { label: 'A5', dimension: '14.8 × 21 cm', ratePerCopy: 0 },
  'Unesco': { label: 'Unesco', dimension: '15.5 × 23 cm', ratePerCopy: 2_000 },
  'B5': { label: 'B5', dimension: '17.6 × 25 cm', ratePerCopy: 5_000 },
  'A6 Saku': { label: 'A6 Saku', dimension: '10.5 × 14.8 cm', ratePerCopy: 0 },
  'A6': { label: 'A6 Saku', dimension: '10.5 × 14.8 cm', ratePerCopy: 0 },
  'A4': { label: 'A4', dimension: '21 × 29.7 cm', ratePerCopy: 5_000 },
};

// Daftar Add-on Resmi Penerbit Novella.id
export const ADDON_PRICES: Record<string, number> = {
  // Layanan Khusus Novella
  'E-Sertifikat': 10_000,
  'E-Sertifikat Penulis': 10_000,
  'Ebook Tanpa Watermark': 250_000,
  'File Ebook Tanpa Watermark': 250_000,
  'Revisi Ringan Cover': 10_000,
  'Revisi Ringan Layout': 10_000,
  'Request Model Cover': 500_000,
  'Request Model Cover (Sedang)': 500_000,
  'Request Model Layout': 1_000_000,
  'Request Model Layout (Sedang)': 1_000_000,
  'Cetak 2 Dummy': 200_000,
  'Video Promosi': 250_000,

  // Layanan Redaksi & Format Tambahan
  'ISBN Resmi': 75_000,
  'ISBN Resmi & Barcode': 75_000,
  'Layout & Sampul': 50_000,
  'Tata Letak & Desain Sampul': 50_000,
  'Proofreading': 100_000,
  'Penyuntingan (Proofreading)': 100_000,
  'Pembatas Buku': 25_000,
  'Pembatas Buku Custom': 25_000,
};

export function calculatePrice(params: PricingParams): PricingResult {
  const pages = Math.max(24, Math.min(600, params.pages || 100));
  const copies = Math.max(5, Math.min(1000, params.copies || 5));

  const defaultSize = BOOK_SIZES['A5']!;
  const sizeKey = params.bookSize || 'A5';
  const sizeConfig = BOOK_SIZES[sizeKey] || defaultSize;
  const sizeRate = sizeConfig.ratePerCopy;

  // Rumus Tambahan Eksemplar: 25.000 / eks (100 hal x 250 tarif BW)
  const extraCopies = Math.max(0, copies - BASE_COPIES) * 25_000;

  // Tambahan Halaman: di atas 100 hal (200 x copies)
  const extraPages = Math.max(0, pages - BASE_PAGES) * 200 * copies;
  const sizeCost = sizeRate * copies;

  const addonItems: { name: string; price: number }[] = [];
  for (const name of params.addons || []) {
    const price = ADDON_PRICES[name];
    if (typeof price === 'number') {
      addonItems.push({ name, price });
    }
  }

  // Cek jika ada finishing Hard Cover
  if (params.coverType === 'Hard Cover' && HARD_COVER_RATES[sizeKey]) {
    const hcRate = HARD_COVER_RATES[sizeKey]!;
    addonItems.push({ name: `Hard Cover ${sizeConfig.label}`, price: hcRate * copies });
  }

  const addonsCost = addonItems.reduce((acc, curr) => acc + curr.price, 0);
  const totalPrice = BASE_PRICE + extraCopies + extraPages + sizeCost + addonsCost;
  const pricePerBook = Math.round(totalPrice / copies);

  return {
    basePrice: BASE_PRICE,
    extraCopies,
    extraPages,
    sizeCost,
    addonsCost,
    totalPrice,
    pricePerBook,
    details: {
      baseCopies: BASE_COPIES,
      basePages: BASE_PAGES,
      sizeName: sizeConfig.label,
      addonItems,
      standardSpecs: STANDARD_SPECS,
    },
  };
}
