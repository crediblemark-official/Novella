import { describe, expect, it } from 'bun:test';
import { calculatePrice, BASE_PRICE, ADDON_PRICES } from '../pricing';

describe('Pricing Engine', () => {
  it('calculates baseline package correctly (100 hal, 5 eks, A5, no addons)', () => {
    const result = calculatePrice({
      pages: 100,
      copies: 5,
      bookSize: 'A5',
      addons: [],
    });

    expect(result.totalPrice).toBe(BASE_PRICE);
    expect(result.totalPrice).toBe(150_000);
    expect(result.extraCopies).toBe(0);
    expect(result.extraPages).toBe(0);
    expect(result.sizeCost).toBe(0);
    expect(result.addonsCost).toBe(0);
    expect(result.pricePerBook).toBe(30_000);
  });

  it('calculates extra copies and pages correctly (including 55 copies = Rp 1.400.000)', () => {
    const result55 = calculatePrice({
      pages: 100,
      copies: 55,
      bookSize: 'A5',
      addons: [],
    });
    expect(result55.totalPrice).toBe(1_400_000);

    const result = calculatePrice({
      pages: 120,
      copies: 10,
      bookSize: 'A5',
      addons: ['ISBN Resmi'],
    });

    expect(result.addonsCost).toBe(75_000);
    expect(result.totalPrice).toBe(400_000);
  });

  it('calculates book size rates correctly (Unesco is in base package, B5 uses B5 rate)', () => {
    const unescoResult = calculatePrice({
      pages: 100,
      copies: 5,
      bookSize: 'Unesco',
      addons: [],
    });
    expect(unescoResult.totalPrice).toBe(150_000);
    expect(unescoResult.originalPrice).toBe(450_000);

    const b5Result = calculatePrice({
      pages: 100,
      copies: 10,
      bookSize: 'B5',
      addons: [],
    });
    expect(b5Result.totalPrice).toBe(425_000);
  });

  it('calculates official Novella add-ons (E-Sertifikat, Ebook, Revisi, Dummy)', () => {
    expect(ADDON_PRICES['E-Sertifikat Penulis']).toBe(10_000);
    expect(ADDON_PRICES['File Ebook Tanpa Watermark']).toBe(250_000);
    expect(ADDON_PRICES['Cetak 2 Dummy']).toBe(200_000);
    expect(ADDON_PRICES['Video Promosi']).toBe(250_000);

    const result = calculatePrice({
      pages: 100,
      copies: 5,
      bookSize: 'A5',
      addons: ['E-Sertifikat Penulis', 'Cetak 2 Dummy'],
    });

    expect(result.addonsCost).toBe(10_000 + 200_000);
    expect(result.totalPrice).toBe(150_000 + 210_000);
  });

  it('suggests copy increment or addons to round odd prices (e.g. 150 hal, 5 eks = Rp 212.500 -> 10 eks = Rp 400.000)', () => {
    // Exact user case from screenshot: 150 pages, 5 copies, A5 BW Soft Cover -> Rp 212.500
    const oddResult = calculatePrice({
      pages: 150,
      copies: 5,
      bookSize: 'A5',
      addons: [],
    });

    expect(oddResult.totalPrice).toBe(212_500);
    expect(oddResult.pricePerBook).toBe(42_500);
    expect(oddResult.suggestions).toBeDefined();
    expect(oddResult.suggestions?.isOdd).toBe(true);
    expect(oddResult.suggestions?.copies).toBeDefined();
    expect(oddResult.suggestions?.copies?.targetCopies).toBe(10);
    expect(oddResult.suggestions?.copies?.newTotal).toBe(400_000);
    expect(oddResult.suggestions?.copies?.diff).toBe(187_500);
    expect(oddResult.suggestions?.copies?.addedCopies).toBe(5);
    expect(oddResult.suggestions?.copies?.newPricePerBook).toBe(40_000);

    // Case with addon suggestion: 120 pages, 5 copies -> 175.000 -> + Pembatas Buku Custom (25.000) = 200.000
    const addonCase = calculatePrice({
      pages: 120,
      copies: 5,
      bookSize: 'A5',
      addons: [],
    });
    expect(addonCase.totalPrice).toBe(175_000);
    expect(addonCase.suggestions).toBeDefined();
    expect(addonCase.suggestions?.isOdd).toBe(true);
    expect(addonCase.suggestions?.addon).toBeDefined();
    expect(addonCase.suggestions?.addon?.addonName).toBe('Pembatas Buku Custom');
    expect(addonCase.suggestions?.addon?.newTotal).toBe(200_000);

    // Even price case: 100 pages, 5 copies -> 150.000 (no suggestions needed)
    const evenResult = calculatePrice({
      pages: 100,
      copies: 5,
      bookSize: 'A5',
      addons: [],
    });
    expect(evenResult.totalPrice).toBe(150_000);
    expect(evenResult.suggestions).toBeUndefined();
  });

  it('does not double-count extraCopies and extraPages breakdown and adds addons after BASE_PRICE floor', () => {
    // 150 pages, 10 copies, A5 BW Soft Cover -> total = 400.000
    // Breakdown: BASE_PRICE (150.000) + extraCopies (187.500) + extraPages (62.500) = 400.000
    const breakdown = calculatePrice({
      pages: 150,
      copies: 10,
      bookSize: 'A5',
      addons: [],
    });
    expect(breakdown.totalPrice).toBe(400_000);
    expect(breakdown.basePrice + breakdown.extraCopies + breakdown.extraPages).toBe(breakdown.totalPrice);

    // Sub-100 pages with addon: 50 pages, 5 copies + E-Sertifikat (10.000) -> 150.000 + 10.000 = 160.000
    const subBaseWithAddon = calculatePrice({
      pages: 50,
      copies: 5,
      bookSize: 'A5',
      addons: ['E-Sertifikat Penulis'],
    });
    expect(subBaseWithAddon.totalPrice).toBe(160_000);
  });

  it('applies Unesco Hard Cover rate (Rp 35.000/copy) instead of A5 rate (Rp 25.000/copy)', () => {
    // 100 pages, 5 copies, Unesco BW Hard Cover:
    // pageRate = 250 - 10 = 240; hardCoverRate = 35.000
    // costPerBook = (100 * 240) + 35.000 = 59.000
    // totalPrintCost = 5 * 59.000 = 295.000; + prepress 25.000 = 320.000
    const unescoHc = calculatePrice({
      pages: 100,
      copies: 5,
      bookSize: 'Unesco',
      printType: 'BW',
      paperType: 'bp57',
      coverType: 'Hard Cover',
      addons: [],
    });
    expect(unescoHc.totalPrice).toBe(320_000);
  });
});
