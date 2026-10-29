import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { vi } from 'vitest';

export type SeenRequest = { url: URL; method: string; headers: Headers; body: unknown };
export type FakeReply = { status?: number; body?: unknown; raw?: Uint8Array; headers?: Record<string, string> };

export function stubFetch(respond: (request: SeenRequest, index: number) => FakeReply): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL, init?: RequestInit) => {
      const request: SeenRequest = {
        url: new URL(String(input)),
        method: (init?.method ?? 'GET').toUpperCase(),
        headers: new Headers(init?.headers),
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : null,
      };
      seen.push(request);
      const reply = respond(request, seen.length - 1);
      const status = reply.status ?? 200;
      const payload = reply.raw ?? (status === 204 ? null : JSON.stringify(reply.body ?? {}));
      return new Response(payload, { status, headers: { 'content-type': 'application/json', ...(reply.headers ?? {}) } });
    }),
  );
  return seen;
}

export function replies(list: FakeReply[]): (request: SeenRequest, index: number) => FakeReply {
  return (_request, index) => list[Math.min(index, list.length - 1)];
}

export const API_KEY = 'sk_test_key';
export const DOMAINS = [
  { id: 101, hostname: 'go.example.com', unicodeHostname: 'go.example.com', segmentKey: 'secret' },
  { id: 202, hostname: 'links.acme.io', unicodeHostname: 'links.acme.io' },
];
export const DOMAIN_PROP = JSON.stringify({ id: 101, hostname: 'go.example.com' });

export function memoryStore(initial: Record<string, unknown> = {}): Store & { read: (key: string) => unknown } {
  const data = new Map<string, string>(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  return {
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

export function testContext(propsValue: Record<string, unknown>): TestContext {
  return {
    auth: { type: AppConnectionType.CUSTOM_AUTH, props: { apiKey: API_KEY } },
    propsValue,
    store: memoryStore(),
    files: { write: async ({ fileName }: { fileName: string }): Promise<string> => `file://${fileName}` },
    server: { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/', token: 'x' },
  };
}

export function run({ action, props }: { action: Runnable; props: Record<string, unknown> }): Promise<unknown> {
  return action.run(testContext(props));
}

export function link(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idString: 'lnk_abc_123',
    id: '123',
    originalURL: 'https://example.com/a',
    shortURL: 'https://go.example.com/a',
    secureShortURL: 'https://go.example.com/a',
    path: 'a',
    password: 'hunter2',
    hasPassword: true,
    createdAt: '2026-10-01T10:00:00.000Z',
    DomainId: 101,
    ...overrides,
  };
}

export type TestContext = {
  auth: { type: AppConnectionType.CUSTOM_AUTH; props: { apiKey: string } };
  propsValue: Record<string, unknown>;
  store: Store;
  files: { write: (input: { fileName: string; data: Buffer }) => Promise<string> };
  server: { apiUrl: string; publicUrl: string; token: string };
};

type Runnable = { run(context: TestContext): Promise<unknown> };
