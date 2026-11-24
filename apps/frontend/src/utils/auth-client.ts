import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL: typeof window !== 'undefined' ? window.location.origin.replace(':4321', ':3001') : 'http://localhost:3001',
});
