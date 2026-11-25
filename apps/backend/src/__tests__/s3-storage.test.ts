import { afterEach, describe, expect, it } from 'bun:test';
import { S3StorageClient } from '../services/s3';

describe('S3StorageClient (GDriveS3 Integration)', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('auto-creates missing bucket, uploads, downloads, and deletes objects using SigV4', async () => {
    const bucketCreated = new Set<string>();
    const objects = new Map<string, { body: Uint8Array; contentType: string }>();
    const seenAuthHeaders: string[] = [];

    globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
      const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url);
      const method = (init?.method || 'GET').toUpperCase();
      const auth = (init?.headers as Record<string, string> | undefined)?.Authorization || '';
      seenAuthHeaders.push(auth);

      if (url.pathname === '/novella-manuscripts') {
        if (method === 'HEAD') {
          return new Response(null, { status: bucketCreated.has('novella-manuscripts') ? 200 : 404 });
        }
        if (method === 'PUT') {
          bucketCreated.add('novella-manuscripts');
          return new Response(null, { status: 200 });
        }
      }

      if (url.pathname === '/novella-manuscripts/sample.pdf') {
        if (method === 'PUT') {
          const bytes = new Uint8Array(await new Response(init?.body as any).arrayBuffer());
          const contentType =
            (init?.headers as Record<string, string> | undefined)?.['content-type'] ||
            'application/octet-stream';
          objects.set(url.pathname, { body: bytes, contentType });
          return new Response(null, { status: 200 });
        }
        if (method === 'GET') {
          const item = objects.get(url.pathname);
          if (!item) return new Response('Not Found', { status: 404 });
          return new Response(Buffer.from(item.body), {
            status: 200,
            headers: { 'content-type': item.contentType },
          });
        }
        if (method === 'HEAD') {
          return new Response(null, { status: objects.has(url.pathname) ? 200 : 404 });
        }
        if (method === 'DELETE') {
          const existed = objects.delete(url.pathname);
          return new Response(null, { status: existed ? 204 : 404 });
        }
      }

      return new Response('Not Found', { status: 404 });
    }) as typeof fetch;

    const client = new S3StorageClient({
      endpoint: 'https://s3.novella.id',
      bucket: 'novella-manuscripts',
      region: 'us-east-1',
      accessKeyId: 'GDS3TESTKEY',
      secretAccessKey: 'test-secret',
    });

    const payload = new TextEncoder().encode('%PDF-1.4 test manuscript');
    await client.putObject('sample.pdf', payload, 'application/pdf');
    expect(bucketCreated.has('novella-manuscripts')).toBe(true);
    expect(await client.headObject('sample.pdf')).toBe(true);

    const downloaded = await client.getObject('sample.pdf');
    expect(downloaded).not.toBeNull();
    expect(downloaded?.headers.get('content-type')).toBe('application/pdf');
    expect(await downloaded?.text()).toBe('%PDF-1.4 test manuscript');

    expect(await client.deleteObject('sample.pdf')).toBe(true);
    expect(await client.getObject('sample.pdf')).toBeNull();
    expect(seenAuthHeaders.every((h) => h.startsWith('AWS4-HMAC-SHA256 Credential=GDS3TESTKEY/'))).toBe(true);
  });
});
