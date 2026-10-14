import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { vi } from 'vitest';

export type SeenRequest = {
  url: string;
  method: string;
  path: string;
  version: string;
  headers: Headers;
  query: URLSearchParams;
  auth: string | null;
  accept: string | null;
  body: unknown;
  userAgent: string | null;
};

export type FakeReply = {
  status?: number;
  body?: unknown;
  text?: string;
  headers?: Record<string, string>;
};

export function stubFetch(respond: (request: SeenRequest, index: number) => FakeReply): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      const headers = new Headers(init?.headers);
      const parsed = new URL(url);
      const rawBody = typeof init?.body === 'string' ? init.body : null;
      const request: SeenRequest = {
        url,
        method: (init?.method ?? 'GET').toUpperCase(),
        path: parsed.pathname.replace(/^\/v[23]/, ''),
        version: parsed.pathname.startsWith('/v3') ? 'v3' : parsed.pathname.startsWith('/v2') ? 'v2' : 'other',
        headers,
        query: parsed.searchParams,
        auth: headers.get('authorization'),
        accept: headers.get('accept'),
        body: rawBody ? JSON.parse(rawBody) : null,
        userAgent: headers.get('user-agent'),
      };
      seen.push(request);
      const reply = respond(request, seen.length - 1);
      const status = reply.status ?? 200;
      const payload = status === 204 ? null : reply.text ?? JSON.stringify(reply.body ?? {});
      return new Response(payload, {
        status,
        headers: { 'content-type': reply.text !== undefined ? 'text/plain' : 'application/json', ...(reply.headers ?? {}) },
      });
    }),
  );
  return seen;
}

export function replies(list: FakeReply[]): (request: SeenRequest, index: number) => FakeReply {
  return (_request, index) => list[Math.min(index, list.length - 1)];
}

export const TOKEN = 'test-token';

export const SERVER = { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/', token: 'x' };

export function dripConnection() {
  return { type: AppConnectionType.SECRET_TEXT as const, secret_text: TOKEN };
}

export function actionContext(propsValue: Record<string, unknown>): TestActionContext {
  return { auth: dripConnection(), propsValue, store: memoryStore(), server: SERVER };
}

export function memoryStore(initial: Record<string, unknown> = {}): MemoryStore {
  const data = new Map<string, string>(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  return {
    keys: (): string[] => [...data.keys()],
    read: (key: string): unknown => {
      const raw = data.get(key);
      return raw === undefined ? undefined : JSON.parse(raw);
    },
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

export async function runStep<T>(promise: Promise<T>): Promise<T> {
  const settled = promise.then(
    (value) => ({ ok: true as const, value }),
    (error: unknown) => ({ ok: false as const, error }),
  );
  await vi.runAllTimersAsync();
  const result = await settled;
  if (!result.ok) {
    throw result.error;
  }
  return result.value;
}

export function run(action: Runnable) {
  return (propsValue: Record<string, unknown>): Promise<unknown> => runStep(action.run(actionContext(propsValue)));
}

export function idsOf(items: unknown): unknown[] {
  return Array.isArray(items) ? items.map((item: unknown) => (item !== null && typeof item === 'object' ? Reflect.get(item, 'id') : undefined)) : [];
}

export type MemoryStore = Store & { read: (key: string) => unknown; keys: () => string[] };

type TestActionContext = {
  auth: { type: AppConnectionType.SECRET_TEXT; secret_text: string };
  propsValue: Record<string, unknown>;
  store: Store;
  server: typeof SERVER;
};

type Runnable = { run(context: TestActionContext): Promise<unknown> };
