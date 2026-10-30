import { vi } from 'vitest';

export const TOKEN = 'sq-test-token';

export function connection() {
  return { access_token: TOKEN, data: { merchant_id: 'MERCHANT1' } };
}

export function stubFetch(respond: (request: SeenRequest, index: number) => FakeReply): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      const headers = new Headers(init?.headers);
      const parsed = new URL(url);
      const raw = init?.body;
      const text = typeof raw === 'string' ? raw : '';
      const request: SeenRequest = {
        url,
        method: (init?.method ?? 'GET').toUpperCase(),
        path: parsed.pathname,
        query: parsed.searchParams,
        headers,
        json: text ? JSON.parse(text) : null,
      };
      seen.push(request);
      const reply = respond(request, seen.length - 1);
      return new Response(reply.body === undefined ? '' : JSON.stringify(reply.body), {
        status: reply.status ?? 200,
        headers: { 'content-type': 'application/json' },
      });
    }),
  );
  return seen;
}

export function memoryStore() {
  const data = new Map<string, string>();
  return {
    put: async <T>(key: string, value: T): Promise<T> => {
      data.set(key, JSON.stringify(value));
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
  };
}

export function context(propsValue: Record<string, unknown>) {
  return {
    auth: connection(),
    propsValue,
    store: memoryStore(),
    files: {},
    server: { apiUrl: '', publicUrl: '', token: '' },
    run: { id: 'run-1' },
    step: { name: 'step_1' },
  };
}

export const LOCATION = { location: { id: 'LOC1', status: 'ACTIVE', currency: 'USD', name: 'Main' } };

export type SeenRequest = {
  url: string;
  method: string;
  path: string;
  query: URLSearchParams;
  headers: Headers;
  json: unknown;
};

export type FakeReply = { status?: number; body?: unknown };
