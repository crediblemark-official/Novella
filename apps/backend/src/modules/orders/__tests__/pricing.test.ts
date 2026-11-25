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

  it('calculates extra copies and pages correctly', () => {
    const result = calculatePrice({
      pages: 120,
      copies: 10,
      bookSize: 'A5',
      addons: ['ISBN Resmi'],
    });

    expect(result.extraCopies).toBe(125_000);
    expect(result.extraPages).toBe(40_000);
    expect(result.addonsCost).toBe(75_000);
    expect(result.totalPrice).toBe(390_000);
  });

  it('calculates book size rates correctly (B5 rate = 5000/copy)', () => {
    const result = calculatePrice({
      pages: 100,
      copies: 10,
      bookSize: 'B5',
      addons: [],
    });

    expect(result.sizeCost).toBe(50_000);
    expect(result.totalPrice).toBe(150_000 + 125_000 + 50_000);
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
