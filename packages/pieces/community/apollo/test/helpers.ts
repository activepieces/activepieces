import { Store } from '@activepieces/pieces-framework';
import { vi } from 'vitest';

export function stubFetch({ respond }: { respond: (request: SeenRequest, index: number) => FakeReply }): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit & { dispatcher?: unknown }) => {
      const url = input instanceof Request ? input.url : String(input);
      const parsed = new URL(url);
      const rawBody = typeof init?.body === 'string' ? init.body : null;
      const request: SeenRequest = {
        url,
        method: (init?.method ?? 'GET').toUpperCase(),
        path: parsed.pathname,
        query: parsed.searchParams,
        headers: new Headers(init?.headers),
        body: rawBody ? JSON.parse(rawBody) : null,
        hasDispatcher: init?.dispatcher !== undefined,
      };
      seen.push(request);
      const reply = respond(request, seen.length - 1);
      if (reply.networkError) {
        throw new TypeError('fetch failed');
      }
      const status = reply.status ?? 200;
      const text = typeof reply.body === 'string' ? reply.body : JSON.stringify(reply.body ?? {});
      const contentType = typeof reply.body === 'string' ? 'text/plain' : 'application/json';
      return new Response(status === 204 ? null : text, { status, headers: { 'content-type': contentType } });
    }),
  );
  return seen;
}

export function replies({ list }: { list: FakeReply[] }): (request: SeenRequest, index: number) => FakeReply {
  return (_request, index) => list[Math.min(index, list.length - 1)];
}

export function memoryStore({ initial }: { initial?: Record<string, unknown> } = {}): Store & { data: Map<string, unknown>; puts: number } {
  const data = new Map<string, unknown>(Object.entries(initial ?? {}));
  const store = {
    data,
    puts: 0,
    async put<T>(key: string, value: T): Promise<T> {
      store.puts++;
      data.set(key, JSON.parse(JSON.stringify(value)));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return data.has(key) ? JSON.parse(JSON.stringify(data.get(key))) : null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
  return store;
}

export function runContext({ props, store, isRepublish }: { props?: Record<string, unknown>; store?: Store; isRepublish?: boolean }) {
  return Object.assign(Object.create(null), {
    auth: { type: 'SECRET_TEXT', secret_text: ` ${API_KEY} ` },
    propsValue: props ?? {},
    store: store ?? memoryStore(),
    isRepublish: isRepublish ?? false,
  });
}

export function errorOf({ promise }: { promise: Promise<unknown> }): Promise<unknown> {
  return promise.then(
    () => {
      throw new Error('expected a failure');
    },
    (error: unknown) => error,
  );
}

export function messageOf({ error }: { error: unknown }): string {
  return error instanceof Error ? error.message : String(error);
}

export const API_KEY = 'apollo_test_key';

export const TEST_SERVER = { apiUrl: '', publicUrl: '', mintOidcToken: async (): Promise<string> => '' };

export type SeenRequest = { url: string; method: string; path: string; query: URLSearchParams; headers: Headers; body: unknown; hasDispatcher: boolean };

export type FakeReply = { status?: number; body?: unknown; networkError?: boolean };
