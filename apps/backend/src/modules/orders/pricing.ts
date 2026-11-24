export interface PricingParams {
  pages: number;
  copies: number;
  bookSize: 'A5' | 'Unesco' | 'B5' | 'A6 Saku' | string;
  addons: string[];
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
  };
}

export const BASE_PRICE = 150_000;
export const BASE_COPIES = 5;
export const BASE_PAGES = 100;

export const BOOK_SIZES: Record<string, { label: string; dimension: string; ratePerCopy: number }> = {
  'A5': { label: 'A5', dimension: '14.8 × 21 cm', ratePerCopy: 0 },
  'Unesco': { label: 'Unesco', dimension: '15.5 × 23 cm', ratePerCopy: 2_000 },
  'B5': { label: 'B5', dimension: '17.6 × 25 cm', ratePerCopy: 5_000 },
  'A6 Saku': { label: 'A6 Saku', dimension: '10.5 × 14.8 cm', ratePerCopy: 0 },
};

export const ADDON_PRICES: Record<string, number> = {
  'ISBN Resmi': 75_000,
  'Layout & Sampul': 50_000,
  'Proofreading': 100_000,
  'Pembatas Buku': 25_000,
};

export function calculatePrice(params: PricingParams): PricingResult {
  const pages = Math.max(24, Math.min(600, params.pages || 100));
  const copies = Math.max(5, Math.min(1000, params.copies || 5));
  
  const defaultSize = BOOK_SIZES['A5']!;
  const sizeConfig = (params.bookSize && BOOK_SIZES[params.bookSize]) ? BOOK_SIZES[params.bookSize]! : defaultSize;
  const sizeRate = sizeConfig.ratePerCopy;

  const extraCopies = Math.max(0, copies - BASE_COPIES) * 25_000;
  const extraPages = Math.max(0, pages - BASE_PAGES) * 200 * copies;
  const sizeCost = sizeRate * copies;

  const addonItems: { name: string; price: number }[] = [];
  for (const name of params.addons || []) {
    const price = ADDON_PRICES[name];
    if (typeof price === 'number') {
      addonItems.push({ name, price });
    }
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
    },
  };
}
