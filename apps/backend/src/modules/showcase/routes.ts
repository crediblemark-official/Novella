import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { publishedBooks, testimonials } from '../../db/schema';
import { desc, eq } from 'drizzle-orm';
import { verifyAdminRequest } from '../admin/routes';

export const showcaseModule = new Elysia()
  // Public Books List
  .get('/api/books', async () => {
    return await db
      .select()
      .from(publishedBooks)
      .where(eq(publishedBooks.isPublished, true))
      .orderBy(desc(publishedBooks.createdAt));
  })
  // Admin Books CRUD
  .get('/api/admin/books', async ({ request, set }) => {
    const isAuthorized = await verifyAdminRequest(request);
    if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }
    return await db.select().from(publishedBooks).orderBy(desc(publishedBooks.createdAt));
  })
  .post(
    '/api/admin/books',
    async ({ request, body, set }) => {
      const isAuthorized = await verifyAdminRequest(request);
      if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }

      const [inserted] = await db
        .insert(publishedBooks)
        .values({
          title: body.title,
          authorName: body.authorName,
          category: body.category,
          pages: body.pages,
          bookSize: body.bookSize,
          coverUrl: body.coverUrl || null,
          synopsis: body.synopsis || null,
          isPublished: body.isPublished ?? true,
        })
        .returning();
      return { success: true, book: inserted };
    },
    {
      body: t.Object({
        title: t.String(),
        authorName: t.String(),
        category: t.String(),
        pages: t.Number(),
        bookSize: t.String(),
        coverUrl: t.Optional(t.String()),
        synopsis: t.Optional(t.String()),
        isPublished: t.Optional(t.Boolean()),
      }),
    }
  )
  .delete('/api/admin/books/:id', async ({ request, params, set }) => {
    const isAuthorized = await verifyAdminRequest(request);
    if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }
    await db.delete(publishedBooks).where(eq(publishedBooks.id, Number(params.id)));
    return { success: true };
  })
  // Public Testimonials List
  .get('/api/testimonials', async () => {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(desc(testimonials.createdAt));
  })
  // Admin Testimonials CRUD
  .get('/api/admin/testimonials', async ({ request, set }) => {
    const isAuthorized = await verifyAdminRequest(request);
    if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }
    return await db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
  })
  .post(
    '/api/admin/testimonials',
    async ({ request, body, set }) => {
      const isAuthorized = await verifyAdminRequest(request);
      if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }

      const [inserted] = await db
        .insert(testimonials)
        .values({
          authorName: body.authorName,
          roleOrCity: body.roleOrCity,
          quote: body.quote,
          rating: body.rating ?? 5,
          isActive: body.isActive ?? true,
        })
        .returning();
      return { success: true, testimonial: inserted };
    },
    {
      body: t.Object({
        authorName: t.String(),
        roleOrCity: t.String(),
        quote: t.String(),
        rating: t.Optional(t.Number()),
        isActive: t.Optional(t.Boolean()),
      }),
    }
  )
  .delete('/api/admin/testimonials/:id', async ({ request, params, set }) => {
    const isAuthorized = await verifyAdminRequest(request);
    if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }
    await db.delete(testimonials).where(eq(testimonials.id, Number(params.id)));
    return { success: true };
  });
