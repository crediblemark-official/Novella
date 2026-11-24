import { describe, expect, it } from 'bun:test';
import { app } from '../index';
import { auth } from '../auth';

describe('Better Auth Full Implementation', () => {
  const testUser = {
    name: 'Penulis Novella Test',
    email: `penulis_${Date.now()}@test.com`,
    password: 'PasswordSuperAman123!',
  };

  let sessionCookie = '';

  it('1. Better Auth exposes server-side API', () => {
    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe('function');
    expect(typeof auth.api.getSession).toBe('function');
  });

  it('2. Sign up with email & password creates user and session via Better Auth', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/auth/sign-up/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.user).toBeDefined();
    expect(body.user.email).toBe(testUser.email);
    expect(body.user.name).toBe(testUser.name);

    // Capture session cookie from Set-Cookie header
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeDefined();
    if (setCookie) {
      sessionCookie = setCookie.split(';')[0] ?? '';
    }
  });

  it('3. Retrieve current session via /api/auth/get-session', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/auth/get-session', {
        headers: {
          Cookie: sessionCookie,
        },
      })
    );

    expect(res.status).toBe(200);
    const session = (await res.json()) as any;
    expect(session).toBeDefined();
    expect(session.user.email).toBe(testUser.email);
  });

  it('4. Sign-in via /api/auth/sign-in/email works seamlessly', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/auth/sign-in/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password,
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.user.email).toBe(testUser.email);
  });

  it('5. Sign in social initiates Google OAuth 2.0 flow', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/auth/sign-in/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'google',
          callbackURL: 'http://localhost:4321/portal',
        }),
      })
    );

    expect(res.status).toBe(200);
    const body = (await res.json()) as any;
    expect(body.url).toBeDefined();
    expect(body.url).toContain('accounts.google.com');
  });

  it('6. Sign out via /api/auth/sign-out revokes session', async () => {
    const res = await app.handle(
      new Request('http://localhost:3001/api/auth/sign-out', {
        method: 'POST',
        headers: {
          Cookie: sessionCookie,
        },
      })
    );

    expect(res.status).toBe(200);

    // Verify session is now null
    const checkRes = await app.handle(
      new Request('http://localhost:3001/api/auth/get-session', {
        headers: {
          Cookie: sessionCookie,
        },
      })
    );
    const checkSession = (await checkRes.json()) as any;
    expect(checkSession).toBeNull();
  });
});
