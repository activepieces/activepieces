import { Store } from '@activepieces/pieces-framework';
import { vi } from 'vitest';

export function stubFetch(respond: (request: SeenRequest, index: number) => FakeReply): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit & { dispatcher?: unknown }) => {
      const url = input instanceof Request ? input.url : String(input);
      const headers = new Headers(init?.headers);
      const parsed = new URL(url);
      const rawBody = typeof init?.body === 'string' ? init.body : null;
      const request: SeenRequest = {
        url,
        method: (init?.method ?? 'GET').toUpperCase(),
        path: parsed.pathname,
        query: parsed.searchParams,
        headers,
        body: rawBody ? JSON.parse(rawBody) : null,
        hasDispatcher: init?.dispatcher !== undefined,
      };
      seen.push(request);
      const reply = respond(request, seen.length - 1);
      const status = reply.status ?? 200;
      return new Response(status === 204 ? null : JSON.stringify(reply.body ?? {}), { status, headers: { 'content-type': 'application/json', ...reply.headers } });
    }),
  );
  return seen;
}

export function replies(list: FakeReply[]): (request: SeenRequest, index: number) => FakeReply {
  return (_request, index) => list[Math.min(index, list.length - 1)];
}

export function memoryStore(initial: Record<string, unknown> = {}): Store & { data: Map<string, unknown> } {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return data.has(key) ? JSON.parse(JSON.stringify(data.get(key))) : null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

export const API_KEY = 'sk_live_test';

export const TEST_SERVER = { apiUrl: '', publicUrl: '', mintOidcToken: async (): Promise<string> => '' };

export type SeenRequest = { url: string; method: string; path: string; query: URLSearchParams; headers: Headers; body: unknown; hasDispatcher: boolean };
export type FakeReply = { status?: number; body?: unknown; headers?: Record<string, string> };
