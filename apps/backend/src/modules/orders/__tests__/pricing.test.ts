import { describe, expect, it } from 'bun:test';
import { calculatePrice, BASE_PRICE } from '../pricing';

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
    // 120 hal (+20 hal), 10 eks (+5 eks), A5, ISBN (+75rb)
    // base: 150.000
    // extra copies: (10 - 5) * 25.000 = 125.000
    // extra pages: (120 - 100) * 200 * 10 = 40.000
    // size: 0
    // addon ISBN: 75.000
    // total: 150.000 + 125.000 + 40.000 + 0 + 75.000 = 390.000
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

    // base: 150.000 + extra copies (5 * 25.000 = 125.000) + size (5.000 * 10 = 50.000)
    expect(result.sizeCost).toBe(50_000);
    expect(result.totalPrice).toBe(150_000 + 125_000 + 50_000);
  });
});
