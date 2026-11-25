import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { staticPlugin } from '@elysiajs/static';
import { ordersModule } from './modules/orders/routes';
import { uploadModule } from './modules/upload/routes';
import { adminModule } from './modules/admin/routes';
import { adminCrmModule } from './modules/admin/crm';
import { authModule } from './modules/auth/routes';
import { settingsModule } from './modules/settings/routes';
import { showcaseModule } from './modules/showcase/routes';
import { db, initDatabase } from './db';
import { orders } from './db/schema';
import { runSeed } from './db/seed';
import { auth } from './auth';
import { startOrderExpiryScheduler } from './services/expiry';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

// Initialize PostgreSQL schema if not present
try {
  await initDatabase();

  // Automatically seed if empty
  const existingOrders = await db.select().from(orders);
  if (existingOrders.length === 0) {
    console.log('🌱 PostgreSQL database is empty, seeding initial records...');
    await runSeed();
  }

  // Start 7-day auto-expiry scheduler for manuscripts
  startOrderExpiryScheduler();
} catch (err: any) {
  console.error('⚠️ Database connection warning during startup:', err.message);
  console.error('👉 Pastikan variabel DATABASE_URL diatur di tab Environment Dokploy!');
}

const isProduction = process.env.NODE_ENV === 'production';
const frontendDistDir = process.env.FRONTEND_DIST_DIR || join(import.meta.dir, '../../frontend/dist');
const hasStaticFrontend = existsSync(frontendDistDir);

export const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie', 'x-admin-token'],
      exposeHeaders: ['Set-Cookie'],
    })
  )
  .use(
    swagger({
      path: '/swagger',
      documentation: {
        info: {
          title: 'Novella.id Backend API',
          description: 'REST API & Upload Engine untuk Website & Portal Penerbitan Novella.id (PostgreSQL + Drizzle)',
          version: '1.0.0',
        },
      },
    })
  )
  .get('/api', () => ({
    name: 'Novella.id Backend API',
    status: 'online',
    runtime: 'Bun ' + Bun.version,
    database: 'PostgreSQL (Drizzle ORM)',
    documentation: '/swagger',
  }))
  .get('/api/health', () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))
  // Dedicated GET handler for Social OAuth Redirect
  .get('/api/auth/sign-in/social', async ({ query }) => {
    const provider = (query.provider as string) || 'google';
    const callbackURL = (query.callbackURL as string) || '/portal';
    try {
      const authRes = await auth.api.signInSocial({
        body: {
          provider: provider as any,
          callbackURL,
        },
        asResponse: true,
      });

      const data = (await authRes.json()) as { url?: string } | null;
      const setCookie = authRes.headers.get('set-cookie');
      if (data && data.url) {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': data.url,
            ...(setCookie ? { 'Set-Cookie': setCookie } : {}),
          },
        });
      }
    } catch (err: any) {
      console.error('Failed social sign-in redirect:', err.message);
    }
    return Response.redirect(callbackURL, 302);
  })
  .all('/api/auth/*', async ({ request }) => {
    return await auth.handler(request);
  })
  .use(authModule)
  .use(ordersModule)
  .use(uploadModule)
  .use(adminModule)
  .use(adminCrmModule)
  .use(settingsModule)
  .use(showcaseModule);

// In production, serve built frontend static files.
// In dev/test, fallback '/' returns API status for backward test compatibility.
if (hasStaticFrontend && isProduction) {
  app.use(
    await staticPlugin({
      assets: frontendDistDir,
      prefix: '',
      indexHTML: true,
    })
  );
} else {
  app.get('/', () => ({
    name: 'Novella.id Backend API',
    status: 'online',
    runtime: 'Bun ' + Bun.version,
    database: 'PostgreSQL (Drizzle ORM)',
    documentation: '/swagger',
  }));
}

const port = process.env.PORT ? Number(process.env.PORT) : 3001;
app.listen(port);

console.log(`🦊 Elysia backend server running at ${app.server?.hostname}:${app.server?.port} with PostgreSQL`);

export type App = typeof app;
