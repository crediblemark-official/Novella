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
          adminWa: '6289629625458',
          companyAddress: 'Jl. Paingan, Maguwoharjo, Sleman',
          companyTagline: 'Penerbitan Sastra Mandiri',
          bankAccounts: [
            { bankName: 'BCA', accountNumber: '8920192831', accountHolder: 'Penerbit Novella' },
          ],
          qrisImageUrl: 'https://ik.imagekit.io/novella/qris-test.png',
          qrisMerchantName: 'Penerbit Novella Nusantara',
        }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.settings.adminWa).toBe('6289629625458');
    expect(data.settings.qrisImageUrl).toBe('https://ik.imagekit.io/novella/qris-test.png');
    expect(data.settings.qrisMerchantName).toBe('Penerbit Novella Nusantara');
  });

  it('4. GET /api/books returns published books list', async () => {
    const res = await app.handle(new Request('http://localhost:3001/api/books'));
    expect(res.status).toBe(200);
    const books = (await res.json()) as any;
    expect(Array.isArray(books)).toBe(true);
    expect(books.length).toBeGreaterThanOrEqual(1);
  });

  it('5. POST /api/admin/books creates, updates, queries by slug, and deletes a book', async () => {
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
          isbn: '978-623-09-9999-1',
          price: 75000,
          publishedYear: 2026,
          isFeatured: true,
          synopsis: 'Sebuah memoar perjalanan malam.',
        }),
      })
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.success).toBe(true);
    expect(data.book.title).toBe('Kidung Malam');
    expect(data.book.slug).toBe('kidung-malam');
    expect(data.book.price).toBe(75000);

    // Fetch single book by slug
    const slugRes = await app.handle(new Request(`http://localhost:3001/api/books/${data.book.slug}`));
    expect(slugRes.status).toBe(200);
    const slugBook = (await slugRes.json()) as any;
    expect(slugBook.isbn).toBe('978-623-09-9999-1');

    // Search query filter
    const searchRes = await app.handle(new Request('http://localhost:3001/api/books?q=Kidung'));
    expect(searchRes.status).toBe(200);
    const searchBooks = (await searchRes.json()) as any[];
    expect(searchBooks.some((b) => b.id === data.book.id)).toBe(true);

    // Update book via PATCH
    const patchRes = await app.handle(
      new Request(`http://localhost:3001/api/admin/books/${data.book.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADER },
        body: JSON.stringify({ price: 80000 }),
      })
    );
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as any;
    expect(patched.book.price).toBe(80000);

    // Clean up
    await app.handle(
      new Request(`http://localhost:3001/api/admin/books/${data.book.id}`, {
        method: 'DELETE',
        headers: ADMIN_HEADER,
      })
    );
  });

  it('5b. POST /api/admin/books/cover uploads cover with backup and serves /api/covers/:fileName', async () => {
    const form = new FormData();
    form.append('file', new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'test-cover.png', { type: 'image/png' }));

    const uploadRes = await app.handle(
      new Request('http://localhost:3001/api/admin/books/cover', {
        method: 'POST',
        headers: ADMIN_HEADER,
        body: form,
      })
    );
    expect(uploadRes.status).toBe(200);
    const data = (await uploadRes.json()) as any;
    expect(data.success).toBe(true);
    expect(typeof data.url).toBe('string');
    expect(data.backupKey).toContain('covers/');

    const fileName = data.backupKey.replace(/^covers\//, '');
    const getRes = await app.handle(new Request(`http://localhost:3001/api/covers/${fileName}`));
    expect(getRes.status).toBe(200);
  });

  it('6. GET /api/testimonials returns active testimonials', async () => {
    const res = await app.handle(new Request('http://localhost:3001/api/testimonials'));
    expect(res.status).toBe(200);
    const list = (await res.json()) as any;
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
  });

  it('6b. POST /api/testimonials requires auth & PATCH /api/admin/testimonials/:id moderates status', async () => {
    const unauthRes = await app.handle(
      new Request('http://localhost:3001/api/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleOrCity: 'Pelajar', quote: 'Mantap' }),
      })
    );
    expect(unauthRes.status).toBe(401);

    const createRes = await app.handle(
      new Request('http://localhost:3001/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADER },
        body: JSON.stringify({
          authorName: 'Test Penulis',
          roleOrCity: 'Sleman',
          quote: 'Proses penerbitan sangat ramah.',
          isActive: false,
        }),
      })
    );
    expect(createRes.status).toBe(200);
    const created = (await createRes.json()) as any;
    expect(created.testimonial.isActive).toBe(false);

    const patchRes = await app.handle(
      new Request(`http://localhost:3001/api/admin/testimonials/${created.testimonial.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...ADMIN_HEADER },
        body: JSON.stringify({ isActive: true }),
      })
    );
    expect(patchRes.status).toBe(200);
    const patched = (await patchRes.json()) as any;
    expect(patched.testimonial.isActive).toBe(true);

    await app.handle(
      new Request(`http://localhost:3001/api/admin/testimonials/${created.testimonial.id}`, {
        method: 'DELETE',
        headers: ADMIN_HEADER,
      })
    );
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

  it('7b. DELETE /api/admin/authors/:id deletes an author and requires admin auth', async () => {
    const unauthRes = await app.handle(
      new Request('http://localhost:3001/api/admin/authors/non-existent-id', { method: 'DELETE' })
    );
    expect(unauthRes.status).toBe(401);

    const { db } = await import('../db');
    const { user } = await import('../db/schema');
    const tempId = `author-del-test-${Date.now()}`;
    await db.insert(user).values({
      id: tempId,
      name: 'Temp Author Delete',
      email: `${tempId}@example.com`,
      emailVerified: true,
      role: 'author',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const delRes = await app.handle(
      new Request(`http://localhost:3001/api/admin/authors/${tempId}`, {
        method: 'DELETE',
        headers: ADMIN_HEADER,
      })
    );
    expect(delRes.status).toBe(200);
    const delBody = (await delRes.json()) as any;
    expect(delBody.success).toBe(true);
    expect(delBody.deletedId).toBe(tempId);

    const missingRes = await app.handle(
      new Request(`http://localhost:3001/api/admin/authors/${tempId}`, {
        method: 'DELETE',
        headers: ADMIN_HEADER,
      })
    );
    expect(missingRes.status).toBe(404);
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
