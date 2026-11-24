import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { ordersModule } from './modules/orders/routes';
import { uploadModule } from './modules/upload/routes';
import { adminModule } from './modules/admin/routes';
import { authModule } from './modules/auth/routes';
import { db } from './db';
import { orders } from './db/schema';
import { runSeed } from './db/seed';

import { auth } from './auth';

// Automatically seed if empty
const count = db.select().from(orders).all().length;
if (count === 0) {
  console.log('🌱 Database is empty, seeding initial records...');
  runSeed();
}

export const app = new Elysia()
  .use(
    cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    })
  )
  .use(
    swagger({
      documentation: {
        info: {
          title: 'Novella.id Backend API',
          description: 'REST API & Upload Engine untuk Website & Portal Penerbitan Novella.id',
          version: '1.0.0',
        },
      },
    })
  )
  .get('/', () => ({
    name: 'Novella.id Backend API',
    status: 'online',
    runtime: 'Bun ' + Bun.version,
    documentation: '/swagger',
  }))
  .all('/api/auth/*', ({ request }) => auth.handler(request))
  .use(authModule)
  .use(ordersModule)
  .use(uploadModule)
  .use(adminModule)
  .listen(process.env.PORT ? Number(process.env.PORT) : 3001);

console.log(`🦊 Elysia backend server running at ${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
