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
});
