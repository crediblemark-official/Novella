import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.port === '4321'
        ? window.location.origin.replace(':4321', ':3001')
        : window.location.origin
      : process.env.BETTER_AUTH_URL || 'http://localhost:3001',
});
