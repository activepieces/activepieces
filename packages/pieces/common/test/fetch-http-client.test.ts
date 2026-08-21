import { createServer } from 'node:http';
import type { Server } from 'node:http';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { httpClient } from '../src/lib/http/core/http-client';
import { HttpMethod } from '../src/lib/http/core/http-method';

let server: Server;
let baseUrl: string;
let receivedBody = '';

beforeAll(async () => {
  server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on('data', (chunk) => chunks.push(chunk));
    request.on('end', () => {
      receivedBody = Buffer.concat(chunks).toString('utf8');
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end('{}');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${getServerPort(server)}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
});

async function send({ body, contentType = 'application/x-www-form-urlencoded' }: SendParams): Promise<string> {
  await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: baseUrl,
    headers: { 'Content-Type': contentType },
    body,
  });
  return receivedBody;
}

function getServerPort(httpServer: Server): number {
  const address = httpServer.address();
  if (address === null || typeof address === 'string') {
    throw new Error('Expected the test server to listen on a TCP port');
  }
  return address.port;
}

describe('form-urlencoded serialization', () => {
  it('encodes arrays with bracket notation', async () => {
    expect(await send({ body: { enabled_events: ['refund.created'], url: 'https://example.com/hook' } })).toBe(
      'enabled_events%5B%5D=refund.created&url=https%3A%2F%2Fexample.com%2Fhook'
    );
  });

  it('repeats the bracketed key for every item', async () => {
    expect(await send({ body: { enabled_events: ['refund.created', 'refund.updated'] } })).toBe(
      'enabled_events%5B%5D=refund.created&enabled_events%5B%5D=refund.updated'
    );
  });

  it('omits empty arrays', async () => {
    expect(await send({ body: { enabled_events: [], url: 'https://example.com' } })).toBe('url=https%3A%2F%2Fexample.com');
  });

  it('encodes nested objects with bracket paths', async () => {
    expect(await send({ body: { metadata: { order_id: '123', nested: { level: 2 } } } })).toBe(
      'metadata%5Border_id%5D=123&metadata%5Bnested%5D%5Blevel%5D=2'
    );
  });

  it('indexes arrays of objects', async () => {
    expect(await send({ body: { items: [{ price: 100 }, { price: 200 }] } })).toBe(
      'items%5B0%5D%5Bprice%5D=100&items%5B1%5D%5Bprice%5D=200'
    );
  });

  it('skips null and undefined values', async () => {
    expect(await send({ body: { a: null, b: undefined, c: [null, 'kept', undefined], d: 'value' } })).toBe(
      'c%5B%5D=kept&d=value'
    );
  });

  it('stringifies primitives and dates', async () => {
    expect(await send({ body: { count: 0, enabled: false, since: new Date(0) } })).toBe(
      'count=0&enabled=false&since=1970-01-01T00%3A00%3A00.000Z'
    );
  });

  it('does not expand buffers into byte indexes', async () => {
    expect(await send({ body: { payload: Buffer.from('hi') } })).toBe('payload=hi');
  });

  it('leaves a prebuilt URLSearchParams body untouched', async () => {
    expect(await send({ body: new URLSearchParams({ 'enabled_events[]': 'refund.created' }) })).toBe(
      'enabled_events%5B%5D=refund.created'
    );
  });

  it('leaves a string body untouched', async () => {
    expect(await send({ body: 'enabled_events[]=refund.created' })).toBe('enabled_events[]=refund.created');
  });

  it('keeps json bodies unaffected', async () => {
    expect(await send({ body: { enabled_events: ['refund.created'] }, contentType: 'application/json' })).toBe(
      '{"enabled_events":["refund.created"]}'
    );
  });
});

type SendParams = {
  body: unknown;
  contentType?: string;
};
