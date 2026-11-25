import { Buffer } from 'node:buffer';

export interface S3StorageConfig {
  endpoint: string;
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
}

function encodeRfc3986(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase()
  );
}

function encodeObjectPath(bucket: string, key: string): string {
  const cleanKey = key.replace(/^\/+/, '');
  const segments = cleanKey
    .split('/')
    .filter(Boolean)
    .map((seg) => encodeRfc3986(seg));
  return `/${encodeRfc3986(bucket)}/${segments.join('/')}`;
}

async function hmacSha256(key: string | ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    typeof key === 'string' ? enc.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  return crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
}

export function loadS3ConfigFromEnv(): S3StorageConfig | null {
  if (process.env.NODE_ENV === 'test' && process.env.S3_ALLOW_IN_TEST !== 'true') {
    return null;
  }

  const endpoint = (process.env.S3_ENDPOINT || '').trim().replace(/\/+$/, '');
  const bucket = (process.env.S3_BUCKET || 'novella-manuscripts').trim();
  const region = (process.env.S3_REGION || 'us-east-1').trim();
  const accessKeyId = (process.env.S3_ACCESS_KEY_ID || '').trim();
  const secretAccessKey = (process.env.S3_SECRET_ACCESS_KEY || '').trim();

  if (!endpoint || !bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return { endpoint, bucket, region, accessKeyId, secretAccessKey };
}

/**
 * Lightweight zero-dependency S3 client (Path-Style + AWS Signature V4)
 * for integrating Novella.id manuscript storage with GDriveS3.
 */
export class S3StorageClient {
  private bucketReadyPromise: Promise<void> | null = null;

  constructor(private readonly config: S3StorageConfig) {}

  get bucket(): string {
    return this.config.bucket;
  }

  private async signAndFetch(
    method: 'GET' | 'HEAD' | 'PUT' | 'DELETE',
    path: string,
    opts?: { body?: Uint8Array; contentType?: string }
  ): Promise<Response> {
    const url = new URL(`${this.config.endpoint}${path}`);
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);
    const bodyBytes = opts?.body;
    const payloadHash = new Bun.CryptoHasher('sha256')
      .update(bodyBytes ?? new Uint8Array(0))
      .digest('hex');

    const headersToSign: Record<string, string> = {
      host: url.host,
      'x-amz-content-sha256': payloadHash,
      'x-amz-date': amzDate,
    };

    if (opts?.contentType) {
      headersToSign['content-type'] = opts.contentType;
    }

    const sortedKeys = Object.keys(headersToSign).sort();
    const canonicalHeaders = sortedKeys.map((k) => `${k}:${headersToSign[k]}\n`).join('');
    const signedHeaders = sortedKeys.join(';');

    const canonicalRequest = [
      method,
      url.pathname,
      '',
      canonicalHeaders,
      signedHeaders,
      payloadHash,
    ].join('\n');

    const scope = `${dateStamp}/${this.config.region}/s3/aws4_request`;
    const stringToSign = [
      'AWS4-HMAC-SHA256',
      amzDate,
      scope,
      new Bun.CryptoHasher('sha256').update(canonicalRequest).digest('hex'),
    ].join('\n');

    const kDate = await hmacSha256(`AWS4${this.config.secretAccessKey}`, dateStamp);
    const kRegion = await hmacSha256(kDate, this.config.region);
    const kService = await hmacSha256(kRegion, 's3');
    const kSigning = await hmacSha256(kService, 'aws4_request');
    const signature = Buffer.from(await hmacSha256(kSigning, stringToSign)).toString('hex');

    const requestHeaders: Record<string, string> = {
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    };

    if (opts?.contentType) {
      requestHeaders['content-type'] = opts.contentType;
    }

    return fetch(url.toString(), {
      method,
      headers: requestHeaders,
      body: bodyBytes ? Buffer.from(bodyBytes) : undefined,
    });
  }

  async ensureBucket(): Promise<void> {
    if (!this.bucketReadyPromise) {
      this.bucketReadyPromise = (async () => {
        const bucketPath = `/${encodeRfc3986(this.config.bucket)}`;
        const headRes = await this.signAndFetch('HEAD', bucketPath);
        if (headRes.ok) return;

        if (headRes.status === 404) {
          const putRes = await this.signAndFetch('PUT', bucketPath);
          if (!putRes.ok && putRes.status !== 409) {
            throw new Error(
              `Gagal membuat bucket S3 "${this.config.bucket}" (HTTP ${putRes.status}): ${await putRes.text()}`
            );
          }
          return;
        }

        throw new Error(
          `Gagal memeriksa bucket S3 "${this.config.bucket}" (HTTP ${headRes.status})`
        );
      })().catch((err) => {
        this.bucketReadyPromise = null;
        throw err;
      });
    }
    return this.bucketReadyPromise;
  }

  async putObject(key: string, data: Uint8Array, contentType: string): Promise<void> {
    await this.ensureBucket();
    const res = await this.signAndFetch('PUT', encodeObjectPath(this.config.bucket, key), {
      body: data,
      contentType,
    });
    if (!res.ok) {
      throw new Error(`S3 PutObject gagal (HTTP ${res.status}): ${await res.text()}`);
    }
  }

  async getObject(key: string): Promise<Response | null> {
    const res = await this.signAndFetch('GET', encodeObjectPath(this.config.bucket, key));
    if (res.status === 404) return null;
    if (!res.ok) {
      throw new Error(`S3 GetObject gagal (HTTP ${res.status}): ${await res.text()}`);
    }
    return res;
  }

  async headObject(key: string): Promise<boolean> {
    const res = await this.signAndFetch('HEAD', encodeObjectPath(this.config.bucket, key));
    return res.ok;
  }

  async deleteObject(key: string): Promise<boolean> {
    const res = await this.signAndFetch('DELETE', encodeObjectPath(this.config.bucket, key));
    if (res.status === 404) return false;
    if (!res.ok && res.status !== 204) {
      throw new Error(`S3 DeleteObject gagal (HTTP ${res.status}): ${await res.text()}`);
    }
    return true;
  }
}

let cachedEnvClient: S3StorageClient | null | undefined;

export function getS3Client(): S3StorageClient | null {
  if (cachedEnvClient !== undefined) return cachedEnvClient;
  const cfg = loadS3ConfigFromEnv();
  cachedEnvClient = cfg ? new S3StorageClient(cfg) : null;
  return cachedEnvClient;
}
