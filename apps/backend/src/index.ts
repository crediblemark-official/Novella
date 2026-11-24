import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { staticPlugin } from '@elysiajs/static';
import { ordersModule } from './modules/orders/routes';
import { uploadModule } from './modules/upload/routes';
import { adminModule } from './modules/admin/routes';
import { authModule } from './modules/auth/routes';
import { db, initDatabase } from './db';
import { orders } from './db/schema';
import { runSeed } from './db/seed';
import { auth } from './auth';
import { join } from 'node:path';
import { existsSync } from 'node:fs';

// Initialize PostgreSQL schema if not present
await initDatabase();

// Automatically seed if empty
const existingOrders = await db.select().from(orders);
if (existingOrders.length === 0) {
  console.log('🌱 PostgreSQL database is empty, seeding initial records...');
  await runSeed();
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
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Cookie'],
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
  .all('/api/auth/*', async ({ request }) => {
    return await auth.handler(request);
  })
  .use(authModule)
  .use(ordersModule)
  .use(uploadModule)
  .use(adminModule);

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
