/// <reference types="vitest/globals" />

import http from 'node:http';
import { Readable } from 'node:stream';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import FormData from 'form-data';

type SeenRequest = {
  contentLength: string | undefined;
  transferEncoding: string | undefined;
  contentType: string | undefined;
  bodyBytes: number;
};

let server: http.Server;
let baseUrl: string;
const seen: SeenRequest[] = [];

beforeAll(async () => {
  server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      seen.push({
        contentLength: req.headers['content-length'],
        transferEncoding: req.headers['transfer-encoding'],
        contentType: req.headers['content-type'],
        bodyBytes: Buffer.concat(chunks).length,
      });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}/`;
});

afterAll(() => server.close());

beforeEach(() => {
  seen.length = 0;
});

describe('multipart form-data body framing', () => {
  test('known-length form-data is sent with Content-Length, not chunked', async () => {
    const formData = new FormData();
    formData.append('greeting', 'hello world');
    formData.append('file', Buffer.from('file content'), { filename: 'a.txt' });

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: baseUrl,
      body: formData,
    });

    expect(seen[0].contentType).toContain('multipart/form-data');
    expect(seen[0].transferEncoding).toBeUndefined();
    expect(seen[0].contentLength).toBe(String(seen[0].bodyBytes));
    expect(seen[0].bodyBytes).toBeGreaterThan(0);
  });

  test('a stream part with knownLength does not crash and falls back to chunked streaming', async () => {
    const formData = new FormData();
    const content = 'streamed with known length';
    formData.append('file', Readable.from([content]), {
      filename: 'c.txt',
      knownLength: content.length,
    });

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: baseUrl,
      body: formData,
    });

    expect(seen[0].contentType).toContain('multipart/form-data');
    expect(seen[0].transferEncoding).toBe('chunked');
    expect(seen[0].contentLength).toBeUndefined();
    expect(seen[0].bodyBytes).toBeGreaterThan(0);
  });

  test('a form over the buffering cap streams chunked instead of double-buffering', async () => {
    const formData = new FormData();
    formData.append('file', Buffer.alloc(101 * 1024 * 1024), { filename: 'big.bin' });

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: baseUrl,
      body: formData,
    });

    expect(seen[0].contentType).toContain('multipart/form-data');
    expect(seen[0].transferEncoding).toBe('chunked');
    expect(seen[0].contentLength).toBeUndefined();
    expect(seen[0].bodyBytes).toBeGreaterThan(101 * 1024 * 1024);
  });

  test('form-data with an unknown-length stream part still streams chunked', async () => {
    const formData = new FormData();
    formData.append('file', Readable.from(['streamed content']), { filename: 'b.txt' });

    await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: baseUrl,
      body: formData,
    });

    expect(seen[0].contentType).toContain('multipart/form-data');
    expect(seen[0].transferEncoding).toBe('chunked');
    expect(seen[0].contentLength).toBeUndefined();
    expect(seen[0].bodyBytes).toBeGreaterThan(0);
  });
});
