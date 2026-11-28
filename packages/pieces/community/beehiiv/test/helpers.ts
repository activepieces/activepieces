import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { createMockActionContext } from '../../../framework/src/lib/test';
import { beehiivTransport } from '../src/lib/common/client';

export function stubBeehiiv({ replies }: { replies: FakeReply[] }): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.spyOn(beehiivTransport, 'getDispatcher').mockResolvedValue(FAKE_DISPATCHER);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.stubGlobal('fetch', async (input: string | URL, init: RequestInit) => {
    const url = String(input);
    const parsed = new URL(url);
    const rawBody = typeof init.body === 'string' ? init.body : null;
    seen.push({
      url,
      method: String(init.method ?? 'GET'),
      path: parsed.pathname,
      rawPath: url.slice('https://api.beehiiv.com'.length).split('?')[0],
      query: parsed.searchParams,
      headers: new Headers(init.headers),
      body: rawBody === null ? undefined : JSON.parse(rawBody),
      hasDispatcher: Reflect.get(init, 'dispatcher') === FAKE_DISPATCHER,
      redirect: init.redirect,
    });
    const reply = replies[Math.min(seen.length - 1, replies.length - 1)];
    if (reply.networkError) {
      throw new TypeError('fetch failed');
    }
    const status = reply.status ?? 200;
    const text = status === 204 || reply.body === undefined ? null : JSON.stringify(reply.body);
    return new Response(text, { status, headers: { 'content-type': 'application/json', ...reply.headers } });
  });
  return seen;
}

export function memoryStore({ initial = {} }: { initial?: Record<string, unknown> } = {}): Store & { data: Map<string, unknown> } {
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

export function actionContext({ propsValue }: { propsValue: Record<string, unknown> }) {
  return { ...createMockActionContext({ propsValue }), auth: AUTH };
}

export function errorMessage({ error }: { error: unknown }): string {
  return error instanceof Error ? error.message : String(error);
}

const FAKE_DISPATCHER = { fake: true };

export const API_KEY = 'bh_test_key';

export const AUTH = { type: AppConnectionType.SECRET_TEXT, secret_text: ` ${API_KEY} ` };

export const PUB = 'pub_9f5d85d8-eb5f-49a7-9c6c-9b6a98b1dab3';

export const SUBSCRIPTION = {
  id: 'sub_b6089911-71eb-4e8c-b791-64278b952eed',
  email: 'odai+bhtest1@activepieces.com',
  status: 'active',
  created: 1794291567,
};

export type SeenRequest = {
  url: string;
  method: string;
  path: string;
  rawPath: string;
  query: URLSearchParams;
  headers: Headers;
  body: unknown;
  hasDispatcher: boolean;
  redirect: RequestRedirect | undefined;
};

export type FakeReply = { status?: number; body?: unknown; headers?: Record<string, string>; networkError?: boolean };
