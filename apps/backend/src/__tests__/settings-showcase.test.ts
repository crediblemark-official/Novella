import { describe, expect, it } from 'bun:test';
import { app } from '../index';

const ADMIN_HEADER = { 'x-admin-token': 'novella_admin_test_session' };

describe('Settings, Showcase & Author CRM Modules', () => {
  it('1. GET /api/settings returns public site settings and bank accounts', async () => {
    const res = await app.handle(new Request('http://localhost:3001/api/settings'));
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.adminWa).toBeDefined();
    expect(data.companyAddress).toBeDefined();
    expect(Array.isArray(data.bankAccounts)).toBe(true);
    expect(data.bankAccounts.length).toBeGreaterThanOrEqual(1);
  });

  it('2. PUT /api/admin/settings rejects unauthenticated requests', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminWa: '628999999999',
          companyAddress: 'Test Address',
          companyTagline: 'Test Tagline',
          bankAccounts: [],
        }),
      })
    );
    expect(res.status).toBe(401);
  });

  it('3. PUT /api/admin/settings updates settings with valid admin token', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...ADMIN_HEADER,
        },
        body: JSON.stringify({
          adminWa: '6281995100401',
          companyAddress: 'Jl. Paingan, Maguwoharjo, Sleman',
          companyTagline: 'Penerbitan Sastra Mandiri',
          bankAccounts: [
            { bankName: 'BCA', accountNumber: '8920192831', accountHolder: 'Penerbit Novella' },
          ],
        }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.settings.adminWa).toBe('6281995100401');
  });

  it('4. GET /api/books returns published books list', async () => {
    const res = await app.handle(new Request('http://localhost:3001/api/books'));
    expect(res.status).toBe(200);
    const books = (await res.json()) as any;
    expect(Array.isArray(books)).toBe(true);
    expect(books.length).toBeGreaterThanOrEqual(1);
  });

  it('5. POST /api/admin/books creates a new book showcase', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/admin/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADER },
        body: JSON.stringify({
          title: 'Kidung Malam',
          authorName: 'Rian Pratama',
          category: 'Novel Sastra',
          pages: 140,
          bookSize: 'A5',
          synopsis: 'Sebuah memoar perjalanan malam.',
        }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.book.title).toBe('Kidung Malam');

    // Clean up
    await app.handle(
      new Request(`http://localhost:3001/api/admin/books/${data.book.id}`, {
        method: 'DELETE',
        headers: ADMIN_HEADER,
      })
    );
  });

  it('6. GET /api/testimonials returns active testimonials', async () => {
    const res = await app.handle(new Request('http://localhost:3001/api/testimonials'));
    expect(res.status).toBe(200);
    const list = (await res.json()) as any;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it('7. GET /api/admin/authors returns author CRM directory', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/admin/authors', {
        headers: ADMIN_HEADER,
      })
    );
    expect(res.status).toBe(200);
    const authors = (await res.json()) as any;
    expect(Array.isArray(authors)).toBe(true);
    expect(authors.length).toBeGreaterThanOrEqual(1);
    expect(authors[0]).toHaveProperty('orderCount');
    expect(authors[0]).toHaveProperty('totalSpend');
  });

  it('8. GET /api/admin/orders/export-csv returns CSV file', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/admin/orders/export-csv', {
        headers: ADMIN_HEADER,
      })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/csv');
    const text = await res.text();
    expect(text).toContain('Kode Pesanan');
  });

  it('9. PATCH /api/admin/orders/:code/tracking updates courier and tracking number', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/admin/orders/NOV-8822/tracking', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADER },
        body: JSON.stringify({
          shippingCourier: 'SiCepat',
          shippingTrackingNumber: '003948123910',
        }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.order.shippingCourier).toBe('SiCepat');
    expect(data.order.shippingTrackingNumber).toBe('003948123910');
  });

  it('10. POST /api/orders/:code/payment-proof updates order payment proof', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/orders/NOV-8822/payment-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proofUrl: '/api/files/slip_transfer.jpg',
        }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.order.paymentProofUrl).toBe('/api/files/slip_transfer.jpg');
  });

  it('11. PATCH /api/admin/orders/:code/pricing updates pages and total price', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/admin/orders/NOV-8822/pricing', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADER },
        body: JSON.stringify({
          pages: 135,
          totalPrice: 185000,
          status: 'Menunggu Konsultasi',
        }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.order.pages).toBe(135);
    expect(data.order.totalPrice).toBe(185000);
  });
});
