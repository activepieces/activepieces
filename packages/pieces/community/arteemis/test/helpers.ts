import { createHmac } from 'crypto';
import { createServer } from 'http';
import { AddressInfo } from 'net';
import { vi } from 'vitest';
import { ARTEEMIS_API_URL } from '../src/lib/common/client';

export const API_KEY = 'art_key_test_0123456789';
export const WEBHOOK_URL = 'https://cloud.activepieces.com/api/v1/webhooks/fl0wId123';
export const SECRET = `whsec_${Buffer.from('arteemis-test-signing-secret-32b').toString('base64')}`;

export type RecordedCall = { tool: string; authorization: string | undefined; body: Record<string, unknown> };
type Answer = { status?: number; body: unknown };
export type Routes = Record<string, (body: Record<string, unknown>) => Answer>;

export const ok = (data: unknown, extra: Record<string, unknown> = {}): Answer => ({ body: { summary: 'ok', data, ...extra } });
export const fail = (status: number, code: string, message: string): Answer => ({ status, body: { error: { code, message } } });

/**
 * A fake Arteemis API on a local port. The piece's HTTP client calls the real fetch, aimed at it: every request to
 * the Arteemis base URL goes over HTTP to this server, which records it and answers `routes[tool]`.
 */
export async function startFakeArteemis() {
  const calls: RecordedCall[] = [];
  const routes: Routes = {};
  const server = createServer((request, response) => {
    let raw = '';
    request.on('data', (chunk) => (raw += chunk));
    request.on('end', () => {
      const tool = (request.url ?? '').replace(/^\/api\/v1\/tools\//, '');
      const body = raw ? JSON.parse(raw) : {};
      calls.push({ tool, authorization: request.headers.authorization, body });
      const route = routes[tool];
      const answer = route ? route(body) : fail(500, 'INTERNAL', `no route for ${tool}`);
      response.writeHead(answer.status ?? 200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(answer.body));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const local = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/v1`;
  const realFetch = globalThis.fetch;
  return {
    calls,
    routes,
    aim() {
      vi.stubGlobal('fetch', (input: string | URL, init?: RequestInit) => {
        const url = String(input);
        if (!url.startsWith(ARTEEMIS_API_URL)) {
          throw new Error(`Unexpected request to ${url}`);
        }
        return realFetch(local + url.slice(ARTEEMIS_API_URL.length), init);
      });
    },
    reset() {
      calls.length = 0;
      for (const key of Object.keys(routes)) {
        delete routes[key];
      }
    },
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

export function makeStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async <T>(key: string) => (data.has(key) ? (data.get(key) as T) : null),
    put: async <T>(key: string, value: T) => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

export function makeContext(props: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) {
  const auth = { type: 'SECRET_TEXT', secret_text: API_KEY };
  return { auth, propsValue: { auth, ...props }, store: makeStore(), webhookUrl: WEBHOOK_URL, ...extra };
}

/** Runs a step's method with a context built by hand, the way the engine calls it. */
export function call<T = unknown>(fn: unknown, context: unknown): Promise<T> {
  if (typeof fn !== 'function') {
    throw new Error('not callable');
  }
  return fn(context);
}

/** A delivery as Arteemis sends it: the raw JSON body and its Standard Webhooks signature headers. */
export function signedPayload(event: unknown, { secret = SECRET, at = Math.floor(Date.now() / 1000), id = 'msg_test_1' } = {}) {
  const rawBody = JSON.stringify(event);
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const signature = createHmac('sha256', key).update(`${id}.${at}.${rawBody}`).digest('base64');
  return {
    body: JSON.parse(rawBody),
    rawBody,
    headers: {
      'content-type': 'application/json',
      'webhook-id': id,
      'webhook-timestamp': String(at),
      'webhook-signature': `v1,${signature}`,
    },
    queryParams: {},
  };
}
