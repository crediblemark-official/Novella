import { describe, expect, it } from 'bun:test';
import { app } from '../index';

describe('Admin Authentication Guard & Module', () => {
  it('1. POST /api/admin/login rejects invalid credentials', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'wrong@novella.id',
          password: 'wrongpassword',
        }),
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.success).toBe(false);
    expect(body.error).toContain('tidak cocok');
  });

  it('2. POST /api/admin/login succeeds with valid admin credentials', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@novella.id',
          password: 'AdminNovella2026!',
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
    expect(body.token).toBeDefined();
    expect(body.token).toStartWith('novella_admin_');
    expect(body.user.role).toBe('admin');
    expect(body.user.email).toBe('admin@novella.id');
  });

  it('3. GET /api/admin/verify rejects unauthorized requests without token', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/admin/verify', {
        headers: { 'Content-Type': 'application/json' },
      })
    );

    expect(res.status).toBe(401);
    const body = (await res.json()) as any;
    expect(body.authenticated).toBe(false);
  });

  it('4. GET /api/admin/verify accepts valid admin token', async () => {
    // 1. First login to obtain token
    const loginRes = await app.handle(
      new Request('http://localhost:3001/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@novella.id',
          password: 'AdminNovella2026!',
        }),
      })
    );
    const loginBody = (await loginRes.json()) as any;

    // 2. Verify with header
    const verifyRes = await app.handle(
      new Request('http://localhost:3001/api/admin/verify', {
        headers: {
          'Authorization': `Bearer ${loginBody.token}`,
        },
      })
    );

    expect(verifyRes.status).toBe(200);
    const verifyBody = (await verifyRes.json()) as any;
    expect(verifyBody.authenticated).toBe(true);
    expect(verifyBody.user.role).toBe('admin');
  });

  it('5. POST /api/admin/logout returns success', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/admin/logout', {
        method: 'POST',
      })
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.success).toBe(true);
  });
});
