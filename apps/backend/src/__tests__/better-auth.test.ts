import { describe, expect, it } from 'bun:test';
import { app } from '../index';
import { auth } from '../auth';

describe('Better Auth Integration', () => {
  it('Better Auth handler is properly mounted on /api/auth/*', async () => {
    // Calling /api/auth/get-session without cookie returns null session (status 200)
    const res = await app.handle(new Request('http://localhost:3001/api/auth/get-session'));
    expect(res.status).toBe(200);
    const session = await res.json();
    expect(session).toBeNull();
  });

  it('Better Auth instance exposes server-side API', () => {
    expect(auth).toBeDefined();
    expect(typeof auth.handler).toBe('function');
    expect(typeof auth.api.getSession).toBe('function');
  });
});
