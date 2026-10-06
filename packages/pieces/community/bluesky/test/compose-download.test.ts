import { createServer, IncomingMessage, Server, ServerResponse } from 'node:http';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { blueskyCompose } from '../src/lib/common/compose';
import { blueskyDownload } from '../src/lib/common/download';

const realIsBlocked = blueskyDownload.isBlockedAddress;
const requests: { path: string; accept: string | undefined }[] = [];
let routes: Record<string, (res: ServerResponse) => void> = {};
let server: Server;
let base = '';

function allowLoopbackLiteral(): void {
  vi.spyOn(blueskyDownload, 'isBlockedAddress').mockImplementation((address) => address !== '127.0.0.1' && realIsBlocked(address));
}

function endless({ res, status, headers = {} }: { res: ServerResponse; status: number; headers?: Record<string, string> }): void {
  res.writeHead(status, headers);
  const timer = setInterval(() => {
    res.write(Buffer.alloc(64 * 1024));
  }, 5);
  res.on('close', () => clearInterval(timer));
}

beforeAll(async () => {
  server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const path = req.url ?? '/';
    requests.push({ path, accept: req.headers['accept'] });
    const route = routes[path];
    if (!route) {
      res.writeHead(404).end('nope');
      return;
    }
    route(res);
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  base = typeof address === 'object' && address !== null ? `http://127.0.0.1:${address.port}` : '';
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

afterEach(() => {
  vi.restoreAllMocks();
  routes = {};
  requests.length = 0;
});

describe('fetchBinary', () => {
  it('downloads the body and returns bytes and content type', async () => {
    allowLoopbackLiteral();
    routes = { '/a.png': (res) => res.writeHead(200, { 'content-type': 'image/png; charset=binary' }).end(Buffer.from([1, 2, 3])) };
    const result = await blueskyCompose.fetchBinary({ url: `${base}/a.png`, maxBytes: 10, label: 'Image 1' });
    expect(Array.from(result.data)).toEqual([1, 2, 3]);
    expect(result.contentType).toBe('image/png');
  });

  it('asks for any content type by default and lets link pages ask for HTML', async () => {
    allowLoopbackLiteral();
    routes = { '/a.png': (res) => res.writeHead(200).end('x') };
    await blueskyCompose.fetchBinary({ url: `${base}/a.png`, maxBytes: 10, label: 'Image 1' });
    await blueskyCompose.fetchBinary({ url: `${base}/a.png`, maxBytes: 10, accept: 'text/html', label: 'Link page' });
    expect(requests.map((request) => request.accept)).toEqual(['*/*', 'text/html']);
  });

  it('rejects a declared content-length above the limit before reading the body', async () => {
    allowLoopbackLiteral();
    routes = { '/big': (res) => res.writeHead(200, { 'content-length': '2000000' }).end(Buffer.alloc(2_000_000)) };
    await expect(blueskyCompose.fetchBinary({ url: `${base}/big`, maxBytes: 1_000_000, label: 'Image 1' })).rejects.toThrow(
      `Image 1 at ${base}/big is 2.0 MB; the limit is 1.0 MB.`,
    );
  });

  it('stops reading once a streamed body passes the limit', async () => {
    allowLoopbackLiteral();
    routes = { '/stream': (res) => endless({ res, status: 200 }) };
    await expect(blueskyCompose.fetchBinary({ url: `${base}/stream`, maxBytes: 1000, label: 'Image 1' })).rejects.toThrow(
      `Image 1 at ${base}/stream is larger than the 1 KB limit.`,
    );
  });

  it('times out while the body is still downloading', async () => {
    allowLoopbackLiteral();
    routes = {
      '/slow': (res) => {
        res.writeHead(200);
        res.write('a');
      },
    };
    await expect(blueskyCompose.fetchBinary({ url: `${base}/slow`, maxBytes: 1000, timeoutMs: 100, label: 'Video' })).rejects.toThrow(
      `Could not download Video from ${base}/slow: timed out after 0 s`,
    );
  });

  it('times out when the server never sends headers', async () => {
    allowLoopbackLiteral();
    routes = { '/hang': () => undefined };
    await expect(blueskyCompose.fetchBinary({ url: `${base}/hang`, maxBytes: 1000, timeoutMs: 100, label: 'Video' })).rejects.toThrow(
      `Could not download Video from ${base}/hang: timed out after 0 s`,
    );
  });

  it('reports the HTTP status of an error without reading its endless body', async () => {
    allowLoopbackLiteral();
    routes = { '/error': (res) => endless({ res, status: 500, headers: { 'content-type': 'text/html' } }) };
    const started = Date.now();
    await expect(blueskyCompose.fetchBinary({ url: `${base}/error`, maxBytes: 1000, timeoutMs: 5000, label: 'Link page' })).rejects.toThrow(
      `Could not download Link page from ${base}/error: HTTP 500.`,
    );
    expect(Date.now() - started).toBeLessThan(2000);
  });

  it('follows a redirect to a public address and checks each hop', async () => {
    allowLoopbackLiteral();
    routes = {
      '/start': (res) => res.writeHead(302, { location: '/final' }).end(),
      '/final': (res) => res.writeHead(200, { 'content-type': 'image/gif' }).end('GIF8'),
    };
    const result = await blueskyCompose.fetchBinary({ url: `${base}/start`, maxBytes: 100, label: 'Image 1' });
    expect(result.contentType).toBe('image/gif');
    expect(requests.map((request) => request.path)).toEqual(['/start', '/final']);
  });

  it('refuses a redirect to the cloud metadata address without contacting it', async () => {
    allowLoopbackLiteral();
    routes = { '/start': (res) => res.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data/' }).end() };
    await expect(blueskyCompose.fetchBinary({ url: `${base}/start`, maxBytes: 100, label: 'Image 1' })).rejects.toThrow(
      /169\.254\.169\.254 is a private, loopback or internal address/,
    );
  });

  it('refuses a redirect to a host name that resolves to a private address', async () => {
    vi.spyOn(blueskyDownload, 'isBlockedAddress').mockImplementationOnce(() => false);
    const port = new URL(base).port;
    routes = { '/start': (res) => res.writeHead(307, { location: `http://localhost:${port}/final` }).end(), '/final': (res) => res.writeHead(200).end('x') };
    await expect(blueskyCompose.fetchBinary({ url: `${base}/start`, maxBytes: 100, label: 'Image 1' })).rejects.toThrow(
      /localhost resolves to .*private, loopback or internal address/,
    );
    expect(requests.map((request) => request.path)).toEqual(['/start']);
  });

  it('stops after five redirects', async () => {
    allowLoopbackLiteral();
    routes = { '/loop': (res) => res.writeHead(301, { location: '/loop' }).end() };
    await expect(blueskyCompose.fetchBinary({ url: `${base}/loop`, maxBytes: 100, label: 'Image 1' })).rejects.toThrow(
      `Could not download Image 1 from ${base}/loop: more than 5 redirects.`,
    );
    expect(requests).toHaveLength(6);
  });

  it('refuses loopback, private and metadata URLs without sending a request', async () => {
    for (const url of ['http://127.0.0.1/a.png', 'http://10.1.2.3/a.png', 'http://169.254.169.254/', 'http://[::1]/a.png', 'http://[::ffff:127.0.0.1]/a.png', 'http://[fd00::1]/']) {
      await expect(blueskyCompose.fetchBinary({ url, maxBytes: 100, label: 'Image 1' }), url).rejects.toThrow(/private, loopback or internal address/);
    }
    await expect(blueskyCompose.fetchBinary({ url: base.replace('127.0.0.1', 'localhost'), maxBytes: 100, label: 'Image 1' })).rejects.toThrow(
      /localhost resolves to/,
    );
    expect(requests).toHaveLength(0);
  });

  it('refuses non-http URLs and embedded credentials without sending a request', async () => {
    await expect(blueskyCompose.fetchBinary({ url: 'file:///etc/passwd', maxBytes: 1000, label: 'Image 1' })).rejects.toThrow(
      'Image 1 "file:///etc/passwd" must start with http:// or https://.',
    );
    await expect(blueskyCompose.fetchBinary({ url: 'https://user:pw@media.example.com/a.png', maxBytes: 1000, label: 'Image 1' })).rejects.toThrow(
      'must not contain a username or password',
    );
    expect(requests).toHaveLength(0);
  });
});

describe('address policy', () => {
  it('blocks private, loopback, link-local, metadata and mapped addresses and allows public ones', () => {
    const blocked = ['127.0.0.1', '10.0.0.1', '172.16.5.4', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '::1', '::', 'fe80::1', 'fd12:3456::1', '::ffff:10.0.0.1', '::ffff:7f00:1', 'not-an-ip'];
    const allowed = ['8.8.8.8', '1.1.1.1', '151.101.1.140', '2606:4700:4700::1111', '2a00:1450:4001:80b::200e'];
    expect(blocked.filter((address) => !blueskyDownload.isBlockedAddress(address))).toEqual([]);
    expect(allowed.filter((address) => blueskyDownload.isBlockedAddress(address))).toEqual([]);
  });

  it('fails a DNS lookup that resolves to a loopback address', async () => {
    const error = await new Promise<unknown>((resolve) => {
      blueskyDownload.guardedLookup({ hostname: 'localhost', options: {}, callback: (lookupError) => resolve(lookupError) });
    });
    expect(error).toBeInstanceOf(Error);
    expect(String(error)).toMatch(/localhost resolves to/);
  });
});
