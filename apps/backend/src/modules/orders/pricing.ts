export interface PricingParams {
  pages: number;
  copies: number;
  bookSize: 'A5' | 'Unesco' | 'B5' | 'A6 Saku' | 'A6' | 'A4' | string;
  addons: string[];
  printType?: 'BW' | 'FC' | string;
  paperType?: 'standard' | 'premium' | string;
  coverType?: 'Soft Cover' | 'Hard Cover' | string;
}

export interface PriceSuggestionCopies {
  targetCopies: number;
  addedCopies: number;
  newTotal: number;
  diff: number;
  newPricePerBook: number;
  label: string;
  description: string;
}

export interface PriceSuggestionAddon {
  addonName: string;
  addonPrice: number;
  newTotal: number;
  diff: number;
  label: string;
  description: string;
}

export interface PriceSuggestions {
  isOdd: boolean;
  copies?: PriceSuggestionCopies;
  addon?: PriceSuggestionAddon;
}

export interface PricingResult {
  basePrice: number;
  originalPrice: number;
  extraCopies: number;
  extraPages: number;
  sizeCost: number;
  addonsCost: number;
  totalPrice: number;
  pricePerBook: number;
  suggestions?: PriceSuggestions;
  details: {
    baseCopies: number;
    basePages: number;
    sizeName: string;
    printType: string;
    paperType: string;
    coverType: string;
    addonItems: { name: string; price: number }[];
    standardSpecs: string;
  };
}

export const BASE_PRICE = 150_000;
export const ORIGINAL_BASE_PRICE = 450_000;
export const BASE_COPIES = 5;
export const BASE_PAGES = 100;
export const STANDARD_SPECS = 'Sudah Termasuk: ISBN Resmi, Desain Cover, Layout Naskah, Soft Cover Ivory 230/260 gr, Lem Panas Kuat, Bookmark, Wrapping & Packing';

// Matriks Resmi Tarif Cetak per Halaman Novella.id (Sesuai Spreadsheet Percetakan)
export const NOVELLA_PRINT_RATES: Record<string, Record<string, { standard: number; premium: number }>> = {
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

// Tarif Finishing Hard Cover (Cover + Laminasi + Binding + Shrink + Pita)
export const HARD_COVER_RATES: Record<string, number> = {
  'A6': 25_000,
  'A5': 25_000,
  'Unesco': 35_000,
  'B5': 45_000,
  'A4': 45_000,
};

export const BOOK_SIZES: Record<string, { label: string; dimension: string; ratePerCopy: number }> = {
  'A5': { label: 'A5', dimension: '14.8 × 21 cm', ratePerCopy: 0 },
  'Unesco': { label: 'Unesco', dimension: '15.5 × 23 cm', ratePerCopy: 0 },
  'B5': { label: 'B5', dimension: '17.6 × 25 cm', ratePerCopy: 5_000 },
  'A6 Saku': { label: 'A6 Saku', dimension: '10.5 × 14.8 cm', ratePerCopy: 0 },
  'A6': { label: 'A6 Saku', dimension: '10.5 × 14.8 cm', ratePerCopy: 0 },
  'A4': { label: 'A4', dimension: '21 × 29.7 cm', ratePerCopy: 5_000 },
};

// Daftar Add-on Resmi Penerbit Novella.id Sesuai Ketentuan Redaksi
export const ADDON_PRICES: Record<string, number> = {
  'E-Sertifikat': 10_000,
  'E-Sertifikat Penulis': 10_000,
  'Ebook Tanpa Watermark': 250_000,
  'File Ebook Tanpa Watermark': 250_000,
  'Revisi Ringan Cover': 10_000,
  'Per Sekali Revisi Cover': 10_000,
  'Revisi Ringan Layout': 10_000,
  'Per Sekali Layout (ringan) Cover': 10_000,
  'Request Model Cover': 500_000,
  'Request Model Cover (Sedang)': 500_000,
  'Request Model Layout': 1_000_000,
  'Request Model Layout (Sedang)': 1_000_000,
  'Cetak 2 Dummy': 200_000,
  'Cetak 2 Buku Dummy': 200_000,
  'Video Promosi': 250_000,
  'Video Promosi Buku': 250_000,
  'ISBN Resmi': 75_000,
  'ISBN Resmi & Barcode': 75_000,
  'Layout & Sampul': 50_000,
  'Tata Letak & Desain Sampul': 50_000,
  'Proofreading': 100_000,
  'Penyuntingan (Proofreading)': 100_000,
  'Pembatas Buku': 25_000,
  'Pembatas Buku Custom': 25_000,
};

export function resolvePaperRate(paper: string = 'bp57', printType: 'BW' | 'FC', cat: string) {
  const isBP = paper === 'bp57' || paper === 'bp72' || paper.toLowerCase().includes('bp') || paper.toLowerCase().includes('bookpaper');
  const isHeavy = paper === 'bp72' || paper === 'hvs80' || paper === 'premium';
  let rate = 250;
  if (printType === 'FC') {
    rate = cat === 'A6' ? 350 : cat === 'B5' ? (isBP ? 1100 : 1050) : (isBP ? 550 : 520);
  } else {
    rate = cat === 'A6' ? 130 : cat === 'B5' ? (isHeavy ? 420 : 400) : (isHeavy ? 275 : 250);
  }
  const label = isBP ? (isHeavy ? 'Bookpaper 72 gr' : 'Bookpaper 57 gr') : (isHeavy ? 'HVS 80 gr' : 'HVS 70 gr');
  return { rate, label, isHeavy, isBP };
}

export function calculatePrice(params: PricingParams): PricingResult {
  const pages = Math.max(24, Math.min(600, Math.round(params.pages || 100)));
  const copies = Math.max(5, Math.min(1000, Math.round(params.copies || 5)));
  const sizeKey = params.bookSize || 'A5';
  const cat = (sizeKey === 'B5' || sizeKey === 'A4') ? 'B5' : (sizeKey === 'A6' || sizeKey === 'A6 Saku') ? 'A6' : 'A5';
  const sizeConfig = BOOK_SIZES[sizeKey] || BOOK_SIZES['A5']!;
  const printType = (params.printType === 'FC' ? 'FC' : 'BW') as 'BW' | 'FC';
  const isHardCover = params.coverType === 'Hard Cover';

  const { rate, label: paperLabel } = resolvePaperRate(params.paperType || 'bp57', printType, cat);
  let pageRate = isHardCover ? Math.max(50, rate - (printType === 'FC' ? 50 : 10)) : rate;

  const hardCoverRate = isHardCover ? (HARD_COVER_RATES[cat] || 25_000) : 0;
  const costPerBook = (pages * pageRate) + hardCoverRate;
  const totalPrintCost = copies * costPerBook;

  const prepressServiceFee = 25_000;
  const originalPrepressFee = 325_000;

  const addonItems: { name: string; price: number }[] = [];
  for (const name of params.addons || []) {
    const price = ADDON_PRICES[name];
    if (typeof price === 'number') addonItems.push({ name, price });
  }

  const addonsCost = addonItems.reduce((acc, curr) => acc + curr.price, 0);
  const totalPrice = Math.max(BASE_PRICE, totalPrintCost + prepressServiceFee) + addonsCost;
  const originalPrice = totalPrintCost + originalPrepressFee + addonsCost;
  const pricePerBook = Math.round(totalPrice / copies);

  const extraCopies = Math.max(0, copies - BASE_COPIES) * costPerBook;
  const extraPages = Math.min(copies, BASE_COPIES) * Math.max(0, pages - BASE_PAGES) * pageRate;
  const sizeCost = Math.max(0, (pageRate - 250) * pages * copies) + (isHardCover ? hardCoverRate * copies : 0);

  const suggestions = findPriceSuggestions(
    copies,
    costPerBook,
    prepressServiceFee,
    addonsCost,
    totalPrice,
    pricePerBook,
    params.addons || [],
  );

  return {
    basePrice: BASE_PRICE,
    originalPrice,
    extraCopies,
    extraPages,
    sizeCost,
    addonsCost,
    totalPrice,
    pricePerBook,
    suggestions,
    details: {
      baseCopies: BASE_COPIES,
      basePages: BASE_PAGES,
      sizeName: sizeConfig.label,
      printType: printType === 'FC' ? 'Full Color (FC)' : 'Hitam Putih (BW)',
      paperType: paperLabel,
      coverType: isHardCover ? 'Hard Cover' : 'Soft Cover',
      addonItems,
      standardSpecs: STANDARD_SPECS,
    },
  };
}

function findPriceSuggestions(
  currentCopies: number,
  costPerBook: number,
  prepressServiceFee: number,
  addonsCost: number,
  totalPrice: number,
  currentPricePerBook: number,
  currentAddons: string[],
): PriceSuggestions | undefined {
  const isOdd = totalPrice % 50_000 !== 0;
  if (!isOdd) return undefined;

  const presetChips = [10, 25, 50, 100];
  const candidates: number[] = [];

  // 1. Presets > current
  for (const p of presetChips) {
    if (p > currentCopies) candidates.push(p);
  }

  // 2. Multiples of 5 > current (up to +30)
  for (let n = currentCopies + 1; n <= Math.min(1000, currentCopies + 30); n++) {
    if (n % 5 === 0 && !candidates.includes(n)) candidates.push(n);
  }

  // 3. Small increments > current (up to +5)
  for (let n = currentCopies + 1; n <= Math.min(1000, currentCopies + 5); n++) {
    if (!candidates.includes(n)) candidates.push(n);
  }

  let bestCopy: PriceSuggestionCopies | undefined;
  let bestCopyScore = -Infinity;

  for (const c of candidates) {
    const candTotal = Math.max(BASE_PRICE, (c * costPerBook) + prepressServiceFee) + addonsCost;
    if (candTotal % 50_000 === 0) {
      const isPreset = presetChips.includes(c);
      const isMultipleOf100k = candTotal % 100_000 === 0;
      const isMultipleOf5 = c % 5 === 0;

      let score = 0;
      if (isPreset) score += 500;
      if (isMultipleOf100k) score += 300;
      if (isMultipleOf5) score += 150;
      score -= (c - currentCopies) * 5;

      if (score > bestCopyScore) {
        bestCopyScore = score;
        const diff = candTotal - totalPrice;
        const addedCopies = c - currentCopies;
        const newPricePerBook = Math.round(candTotal / c);
        const formatId = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');

        bestCopy = {
          targetCopies: c,
          addedCopies,
          newTotal: candTotal,
          diff,
          newPricePerBook,
          label: `Tambah jadi ${c} eks (${formatId(candTotal)})`,
          description: `Cukup tambah +${formatId(diff)} untuk dapat ${addedCopies} buku lagi (total pas ${formatId(candTotal)}). Biaya per buku jadi lebih hemat ${formatId(newPricePerBook)}/eks!`,
        };
      }
    }
  }

  // Add-on suggestions
  const CANDIDATE_ADDONS = [
    'Pembatas Buku Custom',
    'E-Sertifikat Penulis',
    'Revisi Ringan Cover',
    'Revisi Ringan Layout',
    'Penyuntingan (Proofreading)',
    'Cetak 2 Dummy',
    'File Ebook Tanpa Watermark',
    'Video Promosi',
  ];

  let bestAddon: PriceSuggestionAddon | undefined;
  let bestAddonScore = -Infinity;

  for (const name of CANDIDATE_ADDONS) {
    if (currentAddons.includes(name)) continue;
    const price = ADDON_PRICES[name];
    if (typeof price !== 'number') continue;

    const candTotal = totalPrice + price;
    if (candTotal % 50_000 === 0) {
      let score = 1000 - (price / 1000);
      if (candTotal % 100_000 === 0) score += 200;

      if (score > bestAddonScore) {
        bestAddonScore = score;
        const formatId = (val: number) => 'Rp ' + Math.round(val).toLocaleString('id-ID');
        bestAddon = {
          addonName: name,
          addonPrice: price,
          newTotal: candTotal,
          diff: price,
          label: `Tambah ${name} (+${formatId(price)})`,
          description: `Cukup tambah +${formatId(price)} agar total pas ${formatId(candTotal)} sekaligus mendapatkan ${name}.`,
        };
      }
    }
  }

  if (!bestCopy && !bestAddon) return undefined;

  return {
    isOdd,
    copies: bestCopy,
    addon: bestAddon,
  };
}
