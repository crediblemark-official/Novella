import { describe, expect, it, beforeAll } from 'bun:test';
import { app } from '../index';
import { runSeed } from '../db/seed';

describe('Novella.id Full End-to-End API Integration', () => {
  beforeAll(async () => {
    await runSeed();
  });

  it('1. GET / returns status online and runtime information', async () => {
    const res = await app.handle(new Request('http://localhost:3001/'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.status).toBe('online');
    expect(body.name).toBe('Novella.id Backend API');
  });

  it('2. POST /api/auth/google simulates Google sign-in and profile completion check', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'penulis.baru@gmail.com',
          name: 'Penulis Baru',
          avatar: 'PB',
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.user.email).toBe('penulis.baru@gmail.com');
    expect(body.isProfileComplete).toBe(false);

    // Now complete profile with phone and address
    const profileRes = await app.handle(
      new Request('http://localhost:3001/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'penulis.baru@gmail.com',
          phone: '081298765432',
          address: 'Jl. Malioboro No. 10, Yogyakarta',
        }),
      })
    );
    expect(profileRes.status).toBe(200);
    const profileBody = (await profileRes.json()) as any;
    expect(profileBody.user.phone).toBe('081298765432');
    expect(profileBody.user.address).toBe('Jl. Malioboro No. 10, Yogyakarta');
  });

  it('3. POST /api/orders/calculate calculates live pricing accurately', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/orders/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pages: 150,
          copies: 25,
          bookSize: 'Unesco',
          addons: ['ISBN Resmi', 'Layout & Sampul'],
        }),
      })
    );
    expect(res.status).toBe(200);
    const calc = (await res.json()) as any;
    // Cetak 25 eks @ 150 hal (Unesco rate 250): 25 * (150 * 250) = 937.500
    // Prepress service: 25.000
    // Addons: 75.000 (ISBN) + 50.000 (Layout) = 125.000
    // Total: 937.500 + 25.000 + 125.000 = 1.087.500
    expect(calc.totalPrice).toBe(1_087_500);
    expect(calc.pricePerBook).toBe(Math.round(1_087_500 / 25));
  });

  it('4. POST /api/upload uploads a manuscript file and validates file size/type', async () => {
    const formData = new FormData();
    const fakeBlob = new Blob(['Ini adalah naskah sastra lengkap bab 1 sampai bab 10.'], {
      type: 'text/plain',
    });
    formData.append('file', fakeBlob, 'naskah_sastra.txt');

    const res = await app.handle(
      new Request('http://localhost:3001/api/upload', {
        method: 'POST',
        body: formData,
      })
    );

    expect(res.status).toBe(200);
    const uploadResult = (await res.json()) as any;
    expect(uploadResult.success).toBe(true);
    expect(uploadResult.fileOriginalName).toBe('naskah_sastra.txt');
    expect(uploadResult.fileName).toContain('.txt');
  });

  it('5. POST /api/orders creates order, generates WhatsApp message & URL', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorName: 'Penulis Baru',
          authorEmail: 'penulis.baru@gmail.com',
          authorPhone: '081298765432',
          shippingAddress: 'Jl. Malioboro No. 10, Yogyakarta',
          bookTitle: 'Cahaya di Sudut Lorong',
          category: 'Novel',
          pages: 100,
          copies: 5,
          bookSize: 'A5',
          addons: ['ISBN Resmi'],
          fileName: 'lembayung_sample.docx',
          fileOriginalName: 'cahaya.docx',
          fileSize: 1024,
          fileMimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        }),
      })
    );

    expect(res.status).toBe(200);
    const orderData = (await res.json()) as any;
    expect(orderData.success).toBe(true);
    expect(orderData.order.orderCode).toStartWith('NOV-');
    expect(orderData.order.status).toBe('Menunggu Konsultasi');
    expect(orderData.waUrl).toContain('wa.me');
    expect(orderData.waMessage).toContain('kode Pesanan: ' + orderData.order.orderCode);
    expect(orderData.waMessage).toContain('Nama Penulis: Penulis Baru');
  });

  it('6. Tarik Naskah: Author can withdraw order, revoking file download access', async () => {
    // 1. First verify download is active for NOV-8821
    const initialDownloadRes = await app.handle(
      new Request('http://localhost:3001/api/files/lembayung_sample.docx')
    );
    expect(initialDownloadRes.status).toBe(200);

    // 2. Author withdraws manuscript NOV-8821
    const withdrawRes = await app.handle(
      new Request('http://localhost:3001/api/orders/NOV-8821/withdraw', {
        method: 'POST',
      })
    );
    expect(withdrawRes.status).toBe(200);
    const withdrawBody = (await withdrawRes.json()) as any;
    expect(withdrawBody.success).toBe(true);
    expect(withdrawBody.order.status).toBe('Ditarik Penulis');
    expect(withdrawBody.order.isRevoked).toBe(1);

    // 3. Verify file download access is now blocked (403 Forbidden)
    const blockedDownloadRes = await app.handle(
      new Request('http://localhost:3001/api/files/lembayung_sample.docx')
    );
    expect(blockedDownloadRes.status).toBe(403);
    const errBody = (await blockedDownloadRes.json()) as any;
    expect(errBody.error).toContain('Akses naskah ditutup');
  });

  it('7. Tarik Naskah: Cannot withdraw order if already Diproses', async () => {
    // NOV-8822 has status 'Diproses'
    const withdrawRes = await app.handle(
      new Request('http://localhost:3001/api/orders/NOV-8822/withdraw', {
        method: 'POST',
      })
    );
    expect(withdrawRes.status).toBe(400);
    const errBody = (await withdrawRes.json()) as any;
    expect(errBody.error).toContain('Naskah tidak dapat ditarik');
  });

  it('8. Admin KPI calculates metrics correctly', async () => {
    const kpiRes = await app.handle(
      new Request('http://localhost:3001/api/admin/kpi', {
        headers: { 'x-admin-token': 'novella_admin_test_session' },
      })
    );
    expect(kpiRes.status).toBe(200);
    const kpi = (await kpiRes.json()) as any;
    expect(kpi.totalOrders).toBeGreaterThanOrEqual(3);
    expect(typeof kpi.waitingVerification).toBe('number');
    expect(typeof kpi.totalActiveValue).toBe('number');
  });

  it('9. Admin can update order status (Menunggu Verifikasi -> Diproses -> Selesai)', async () => {
    const updateRes = await app.handle(
      new Request('http://localhost:3001/api/orders/NOV-8822/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Selesai' }),
      })
    );
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()) as any;
    expect(updated.order.status).toBe('Selesai');
  });

  it('10. Auto-Expiry & Final Status Guard: Cannot modify Ditarik Penulis or Kedaluwarsa orders', async () => {
    // NOV-8821 was withdrawn in test 6
    const attemptUpdateRes = await app.handle(
      new Request('http://localhost:3001/api/orders/NOV-8821/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Diproses' }),
      })
    );
    expect(attemptUpdateRes.status).toBe(400);
    const errBody = (await attemptUpdateRes.json()) as any;
    expect(errBody.error).toContain('bersifat final');

    // Trigger cleanup expired endpoint with admin token
    const cleanupRes = await app.handle(
      new Request('http://localhost:3001/api/admin/cleanup-expired', {
        method: 'POST',
        headers: { 'x-admin-token': 'novella_admin_test_session' },
      })
    );
    expect(cleanupRes.status).toBe(200);
    const cleanupData = (await cleanupRes.json()) as any;
    expect(cleanupData.success).toBe(true);
    expect(typeof cleanupData.cleanedCount).toBe('number');
  });
});
