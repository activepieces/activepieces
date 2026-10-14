import { AppConnectionType } from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { createMockActionContext } from '../../../framework/src/lib/test';

export function apiKeyAuth() {
  return { type: AppConnectionType.CUSTOM_AUTH as const, props: { apiKey: ' key_test ' } };
}

export function legacyAuth() {
  return { type: AppConnectionType.SECRET_TEXT as const, secret_text: ' tok_legacy ' };
}

export function runAction({
  action,
  propsValue,
  auth = apiKeyAuth(),
}: {
  action: { run: (context: never) => Promise<unknown> };
  propsValue: Record<string, unknown>;
  auth?: ReturnType<typeof apiKeyAuth> | ReturnType<typeof legacyAuth>;
}): Promise<unknown> {
  const context = { ...createMockActionContext({ propsValue: {} }), propsValue, auth };
  return Reflect.apply(action.run, action, [context]);
}

export function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    store: {
      put: async <T>(key: string, value: T) => {
        data.set(key, JSON.stringify(value));
        return value;
      },
      get: async <T>(key: string): Promise<T | null> => {
        const raw = data.get(key);
        return raw === undefined ? null : JSON.parse(raw);
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

export function jsonResponse({ status = 200, body }: { status?: number; body: unknown }): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function listBody({ data, currentPage = 1, lastPage = 1, perPage = 25, total }: { data: unknown[]; currentPage?: number; lastPage?: number; perPage?: number; total?: number }) {
  return {
    status: 'success',
    data,
    pagination: {
      currentPage,
      perPage,
      total: total ?? data.length,
      lastPage,
      nextPageUrl: currentPage < lastPage ? `https://evil.example.com/steal?page=${currentPage + 1}` : null,
      prevPageUrl: null,
    },
  };
}

export function installFetch() {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  return fetchMock;
}

export function requestOf({ fetchMock, call }: { fetchMock: ReturnType<typeof vi.fn>; call: number }) {
  const [input, init] = fetchMock.mock.calls[call];
  const headers = new Headers(init?.headers);
  const url = new URL(String(input));
  const rawBody = init?.body;
  return {
    url: String(input),
    origin: url.origin,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    method: String(init?.method ?? 'GET'),
    headers: Object.fromEntries(headers.entries()),
    body: typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody,
    dispatcher: init?.dispatcher,
    redirect: init?.redirect,
  };
}

export const BRAND = {
  id: 42,
  title: 'Acme Marketing',
  description: 'Social channels for the Acme team',
  timezone: 'Europe/London',
  queueStatus: 'ACTIVE',
  createdAt: '2026-09-15T10:20:30.000000Z',
  updatedAt: '2026-10-01T14:05:00.000000Z',
};

export const POST = {
  id: 8801,
  collectionId: 77,
  title: 'Product launch',
  body: 'Our new product is live.',
  media: [],
  postType: 'TEXT',
  postingType: 'SCHEDULE',
  status: 'PENDING',
  postDate: '2026-10-12 08:00:00',
  createdAt: '2026-10-05T12:00:00.000000Z',
  updatedAt: '2026-10-05T14:00:00.000000Z',
};

export function publishedPost({ id, publishedAt = '2026-10-10T14:00:00.000000Z' }: { id: number; publishedAt?: string }) {
  return {
    id,
    postId: 8801,
    collectionId: 77,
    channel: { id: 501, name: 'Acme on LinkedIn', type: 'LinkedIn' },
    postType: 'IMAGE',
    body: 'Our new product is live.',
    url: 'https://www.linkedin.com/feed/update/urn:li:share:123',
    status: 'PUBLISHED',
    message: null,
    publishedAt,
    results: { likes: 42, comments: 5, shares: 3, views: 1200, saves: 18, engagement: 68, clicks: 27, impressions: 1540, reach: 1310 },
  };
}
