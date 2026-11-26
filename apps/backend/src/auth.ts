import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db';
import * as schema from './db/schema';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Robust environment variables loader for multi-workspace & root execution
function loadEnvFallback() {
  const envPaths = [
    join(import.meta.dir, '../.env'),
    join(import.meta.dir, '../../../.env'),
  ];
  for (const p of envPaths) {
    if (existsSync(p)) {
      try {
        const content = readFileSync(p, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const idx = trimmed.indexOf('=');
          if (idx !== -1) {
            const k = trimmed.slice(0, idx).trim();
            const v = trimmed.slice(idx + 1).trim();
            if (!process.env[k]) process.env[k] = v;
          }
        }
      } catch {}
    }
  }
}
loadEnvFallback();

const isProd =
  process.env.NODE_ENV === 'production' ||
  Boolean(process.env.BETTER_AUTH_URL && !process.env.BETTER_AUTH_URL.includes('localhost') && !process.env.BETTER_AUTH_URL.includes('127.0.0.1'));

const trustedOrigins = [
  'http://localhost:4321',
  'http://localhost:4322',
  'http://localhost:4323',
  'http://localhost:3001',
  'http://localhost:3000',
  'http://localhost:3010',
  'http://127.0.0.1:4321',
  'http://127.0.0.1:4322',
  'http://127.0.0.1:4323',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3010',
  'https://novella.id',
  'https://www.novella.id',
  'https://buku.novella.id',
  'https://panel.novella.id',
  'http://novella.id',
  'http://www.novella.id',
  ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  ...(process.env.TRUSTED_ORIGINS ? process.env.TRUSTED_ORIGINS.split(',').map((s) => s.trim()) : []),
];

export const auth = betterAuth({
  secret:
    process.env.BETTER_AUTH_SECRET ||
    'novella_secret_auth_key_2026_at_least_32_characters_long_super_safe',
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3001',
  trustedOrigins,
  advanced: {
    crossSubDomainCookies: {
      enabled: isProd,
      domain: isProd ? '.novella.id' : undefined,
    },
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: isProd,
    },
  },
  account: {
    skipStateCookieCheck: true,
    accountLinking: {
      enabled: true,
      trustedProviders: ['google'],
    },
  },
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || 'mock-google-client-id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock-google-client-secret',
      prompt: 'select_account',
    },
  },
  user: {
    additionalFields: {
      phone: {
        type: 'string',
        required: false,
      },
      address: {
        type: 'string',
        required: false,
      },
      role: {
        type: 'string',
        required: false,
        defaultValue: 'author',
      },
    },
  },
});

export type Auth = typeof auth;
