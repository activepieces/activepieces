import { vi } from 'vitest';

export type RecordedCall = {
  method: string;
  url: URL;
  headers: Record<string, string>;
  body: unknown;
  redirect: string | undefined;
};

export type FakeResponse = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

export function stubFetch(responses: FakeResponse[]) {
  const calls: RecordedCall[] = [];
  const queue = [...responses];
  const fetchMock = vi.fn(async (input: string | URL, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    new Headers(init?.headers).forEach((value, key) => {
      headers[key] = value;
    });
    const rawBody = typeof init?.body === 'string' ? init.body : undefined;
    calls.push({
      method: init?.method ?? 'GET',
      url: new URL(String(input)),
      headers,
      body: rawBody === undefined ? undefined : JSON.parse(rawBody),
      redirect: init?.redirect,
    });
    const next = queue.shift();
    if (next === undefined) {
      throw new Error(`Unexpected request ${init?.method} ${String(input)}`);
    }
    const status = next.status ?? 200;
    const noBody = status === 204 || (status >= 300 && status < 400);
    return new Response(noBody ? null : next.body === undefined ? '' : JSON.stringify(next.body), {
      status,
      headers: { 'content-type': 'application/json', ...(next.headers ?? {}) },
    });
  });
  vi.stubGlobal('fetch', fetchMock);
  return calls;
}

export function makeStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: vi.fn(async (key: string) => (data.has(key) ? data.get(key) : null)),
    put: vi.fn(async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    }),
    delete: vi.fn(async (key: string) => {
      data.delete(key);
    }),
  };
}

export function makeContext({ props, extra = {}, websiteUrl = SITE }: { props: Record<string, unknown>; extra?: Record<string, unknown>; websiteUrl?: string }) {
  const auth = { type: 'CUSTOM_AUTH', props: { api_key: ` ${API_KEY} `, api_username: 'system', website_url: websiteUrl } };
  return {
    auth,
    propsValue: { auth, ...props },
    store: makeStore(),
    webhookUrl: 'https://cloud.activepieces.com/api/v1/webhooks/flow123',
    ...extra,
  };
}

export function call({ fn, ctx }: { fn: unknown; ctx: unknown }): Promise<unknown> {
  if (typeof fn !== 'function') {
    throw new Error('not callable');
  }
  return fn(ctx);
}

export const API_KEY = 'key-123';
export const SITE = 'https://forum.example.com/';
export const BASE = 'https://forum.example.com';
