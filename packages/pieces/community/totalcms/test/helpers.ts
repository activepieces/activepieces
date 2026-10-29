import { vi } from 'vitest';

export const API_KEY = 'tcms_test_key';
export const SITE = 'https://cms.example.com';

export function connection() {
  return { type: 'CUSTOM_AUTH', props: { domain: `${SITE}/`, apiKey: ` ${API_KEY} ` } };
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
      const text = typeof raw === 'string' ? raw : Buffer.isBuffer(raw) ? raw.toString('latin1') : '';
      const request: SeenRequest = {
        url,
        method: (init?.method ?? 'GET').toUpperCase(),
        path: decodeURIComponent(parsed.pathname),
        rawPath: parsed.pathname,
        query: parsed.searchParams,
        headers,
        text,
        json: headers.get('content-type')?.includes('application/json') && text ? JSON.parse(text) : null,
        redirect: init?.redirect,
      };
      seen.push(request);
      const reply = respond(request, seen.length - 1);
      const payload = reply.text ?? (reply.body === undefined ? '' : JSON.stringify(reply.body));
      return new Response(payload, {
        status: reply.status ?? 200,
        headers: { 'content-type': reply.text !== undefined ? 'text/plain' : 'application/json', ...(reply.headers ?? {}) },
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
  return contextWithStore({ propsValue, store: memoryStore() });
}

export function contextWithStore({ propsValue, store }: { propsValue: Record<string, unknown>; store: ReturnType<typeof memoryStore> }) {
  return { auth: connection(), propsValue, store, files: {}, server: { apiUrl: '', publicUrl: '', token: '' }, isRepublish: false };
}

export type SeenRequest = {
  url: string;
  method: string;
  path: string;
  rawPath: string;
  query: URLSearchParams;
  headers: Headers;
  text: string;
  json: unknown;
  redirect: RequestRedirect | undefined;
};

export type FakeReply = { status?: number; body?: unknown; text?: string; headers?: Record<string, string> };
