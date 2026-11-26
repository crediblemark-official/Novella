import { Elysia, t } from 'elysia';
import { db } from '../../db';
import { publishedBooks, testimonials } from '../../db/schema';
import { asc, desc, eq, and } from 'drizzle-orm';
import { verifyAdminRequest } from '../admin/routes';
import { auth } from '../../auth';
import { readCoverBackup, uploadCoverWithBackup } from '../../services/imagekit';

const ALLOWED_COVER_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_COVER_SIZE = 10 * 1024 * 1024; // 10MB

function slugifyTitle(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'buku';
}

async function ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  let candidate = slugifyTitle(baseSlug);
  let suffix = 1;
  while (true) {
    const [first] = await db
      .select({ id: publishedBooks.id })
      .from(publishedBooks)
      .where(eq(publishedBooks.slug, candidate));
    if (!first || (excludeId !== undefined && first.id === excludeId)) {
      return candidate;
    }
    suffix += 1;
    candidate = `${slugifyTitle(baseSlug)}-${suffix}`;
  }
}

const bookBodySchema = t.Object({
  slug: t.Optional(t.String()),
  title: t.String(),
  authorName: t.String(),
  authorBio: t.Optional(t.String()),
  category: t.String(),
  pages: t.Number(),
  bookSize: t.String(),
  isbn: t.Optional(t.String()),
  publishedYear: t.Optional(t.Number()),
  price: t.Optional(t.Number()),
  coverUrl: t.Optional(t.String()),
  synopsis: t.Optional(t.String()),
  buyUrl: t.Optional(t.String()),
  isFeatured: t.Optional(t.Boolean()),
  isPublished: t.Optional(t.Boolean()),
});

export const showcaseModule = new Elysia()
  // Public Books List (with optional search, category, featured, and sort)
  .get('/api/books', async ({ query }) => {
    const sortMode = query.sort || 'newest';
    const orderExpr =
      sortMode === 'title'
        ? asc(publishedBooks.title)
        : sortMode === 'price_asc'
          ? asc(publishedBooks.price)
          : sortMode === 'price_desc'
            ? desc(publishedBooks.price)
            : desc(publishedBooks.createdAt);

    let rows = await db
      .select()
      .from(publishedBooks)
      .where(eq(publishedBooks.isPublished, true))
      .orderBy(orderExpr);

    if (query.category && query.category !== 'Semua') {
      const cat = query.category.toLowerCase();
      rows = rows.filter((b) => b.category.toLowerCase() === cat);
    }
    if (query.featured === 'true') {
      rows = rows.filter((b) => b.isFeatured);
    }
    if (query.q && query.q.trim()) {
      const q = query.q.trim().toLowerCase();
      rows = rows.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.authorName.toLowerCase().includes(q) ||
          (b.isbn && b.isbn.toLowerCase().includes(q)) ||
          b.category.toLowerCase().includes(q)
      );
    }

    return rows;
  })
  // Public Single Book Detail by slug or numeric ID
  .get('/api/books/:slugOrId', async ({ params, set }) => {
    const raw = params.slugOrId;
    const isNumeric = /^\d+$/.test(raw);
    const rows = await db
      .select()
      .from(publishedBooks)
      .where(
        and(
          eq(publishedBooks.isPublished, true),
          isNumeric ? eq(publishedBooks.id, Number(raw)) : eq(publishedBooks.slug, raw)
        )
      );
    if (rows.length === 0) {
      set.status = 404;
      return { error: 'Buku tidak ditemukan' };
    }
    return rows[0];
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

      const slug = await ensureUniqueSlug(body.slug?.trim() || body.title);
      const [inserted] = await db
        .insert(publishedBooks)
        .values({
          slug,
          title: body.title,
          authorName: body.authorName,
          authorBio: body.authorBio || null,
          category: body.category,
          pages: body.pages,
          bookSize: body.bookSize,
          isbn: body.isbn || null,
          publishedYear: body.publishedYear ?? null,
          price: body.price ?? null,
          coverUrl: body.coverUrl || null,
          synopsis: body.synopsis || null,
          buyUrl: body.buyUrl || null,
          isFeatured: body.isFeatured ?? false,
          isPublished: body.isPublished ?? true,
        })
        .returning();
      return { success: true, book: inserted };
    },
    { body: bookBodySchema }
  )
  .patch(
    '/api/admin/books/:id',
    async ({ request, params, body, set }) => {
      const isAuthorized = await verifyAdminRequest(request);
      if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }

      const id = Number(params.id);
      const [current] = await db.select().from(publishedBooks).where(eq(publishedBooks.id, id));
      if (!current) {
        set.status = 404;
        return { error: 'Buku tidak ditemukan' };
      }

      const nextSlug =
        body.slug !== undefined
          ? await ensureUniqueSlug(body.slug.trim() || body.title || current.title, id)
          : current.slug || (await ensureUniqueSlug(body.title || current.title, id));

      const [updated] = await db
        .update(publishedBooks)
        .set({
          slug: nextSlug,
          title: body.title ?? current.title,
          authorName: body.authorName ?? current.authorName,
          authorBio: body.authorBio !== undefined ? body.authorBio || null : current.authorBio,
          category: body.category ?? current.category,
          pages: body.pages ?? current.pages,
          bookSize: body.bookSize ?? current.bookSize,
          isbn: body.isbn !== undefined ? body.isbn || null : current.isbn,
          publishedYear: body.publishedYear !== undefined ? body.publishedYear : current.publishedYear,
          price: body.price !== undefined ? body.price : current.price,
          coverUrl: body.coverUrl !== undefined ? body.coverUrl || null : current.coverUrl,
          synopsis: body.synopsis !== undefined ? body.synopsis || null : current.synopsis,
          buyUrl: body.buyUrl !== undefined ? body.buyUrl || null : current.buyUrl,
          isFeatured: body.isFeatured ?? current.isFeatured,
          isPublished: body.isPublished ?? current.isPublished,
          updatedAt: new Date(),
        })
        .where(eq(publishedBooks.id, id))
        .returning();

      return { success: true, book: updated };
    },
    {
      body: t.Partial(bookBodySchema),
    }
  )
  .delete('/api/admin/books/:id', async ({ request, params, set }) => {
    const isAuthorized = await verifyAdminRequest(request);
    if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }
    await db.delete(publishedBooks).where(eq(publishedBooks.id, Number(params.id)));
    return { success: true };
  })
  // Admin Book Cover Upload (ImageKit primary + GDriveS3 backup)
  .post(
    '/api/admin/books/cover',
    async ({ request, body, set }) => {
      const isAuthorized = await verifyAdminRequest(request);
      if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }

      const file = body.file as File;
      if (!file) {
        set.status = 400;
        return { error: 'Gambar sampul wajib dipilih.' };
      }
      if (file.size > MAX_COVER_SIZE) {
        set.status = 413;
        return { error: 'Ukuran gambar sampul maksimal 10 MB.' };
      }

      const originalName = file.name || 'cover.jpg';
      const dotIdx = originalName.lastIndexOf('.');
      const ext = dotIdx !== -1 ? originalName.substring(dotIdx).toLowerCase() : '';
      if (!ALLOWED_COVER_EXTS.includes(ext)) {
        set.status = 400;
        return { error: 'Format gambar harus .jpg, .jpeg, .png, atau .webp.' };
      }

      const safeName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`;
      const mimeType = file.type || 'image/jpeg';
      const bytes = new Uint8Array(await file.arrayBuffer());
      const uploaded = await uploadCoverWithBackup(safeName, bytes, mimeType);

      return {
        success: true,
        ...uploaded,
      };
    },
    {
      body: t.Object({
        file: t.File(),
      }),
    }
  )
  // Serve backed-up cover from GDriveS3 / local fallback
  .get('/api/covers/:fileName', async ({ params, set }) => {
    const result = await readCoverBackup(params.fileName);
    if (!result) {
      set.status = 404;
      return { error: 'Sampul buku tidak ditemukan.' };
    }
    if (result.kind === 's3') {
      return new Response(result.response.body, {
        headers: {
          'Content-Type': result.response.headers.get('content-type') || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
    return new Response(result.file, {
      headers: {
        'Content-Type': result.file.type || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  })
  // Public Testimonials List
  .get('/api/testimonials', async () => {
    return await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(desc(testimonials.createdAt));
  })
  // Author Submit Testimonial (Authenticated Portal User -> Pending Moderation)
  .post(
    '/api/testimonials',
    async ({ request, body, set }) => {
      const session = await auth.api.getSession({ headers: request.headers }).catch(() => null);
      if (!session?.user) {
        set.status = 401;
        return { error: 'Silakan masuk terlebih dahulu untuk mengirim testimoni.' };
      }

      const [inserted] = await db
        .insert(testimonials)
        .values({
          authorName: (body.authorName || session.user.name || 'Penulis Novella').trim(),
          roleOrCity: body.roleOrCity.trim(),
          quote: body.quote.trim(),
          rating: Math.min(5, Math.max(1, body.rating ?? 5)),
          isActive: false,
        })
        .returning();

      return { success: true, testimonial: inserted };
    },
    {
      body: t.Object({
        authorName: t.Optional(t.String()),
        roleOrCity: t.String(),
        quote: t.String(),
        rating: t.Optional(t.Number()),
      }),
    }
  )
  // Admin Testimonials CRUD & Moderation
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
  .patch(
    '/api/admin/testimonials/:id',
    async ({ request, params, body, set }) => {
      const isAuthorized = await verifyAdminRequest(request);
      if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }

      const id = Number(params.id);
      const [current] = await db.select().from(testimonials).where(eq(testimonials.id, id));
      if (!current) {
        set.status = 404;
        return { error: 'Testimoni tidak ditemukan' };
      }

      const [updated] = await db
        .update(testimonials)
        .set({
          authorName: body.authorName ?? current.authorName,
          roleOrCity: body.roleOrCity ?? current.roleOrCity,
          quote: body.quote ?? current.quote,
          rating: body.rating ?? current.rating,
          isActive: body.isActive ?? current.isActive,
        })
        .where(eq(testimonials.id, id))
        .returning();

      return { success: true, testimonial: updated };
    },
    {
      body: t.Partial(
        t.Object({
          authorName: t.String(),
          roleOrCity: t.String(),
          quote: t.String(),
          rating: t.Number(),
          isActive: t.Boolean(),
        })
      ),
    }
  )
  .delete('/api/admin/testimonials/:id', async ({ request, params, set }) => {
    const isAuthorized = await verifyAdminRequest(request);
    if (!isAuthorized) { set.status = 401; return { error: 'Unauthorized' }; }
    await db.delete(testimonials).where(eq(testimonials.id, Number(params.id)));
    return { success: true };
  });
