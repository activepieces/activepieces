import { AppConnectionType } from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { createMockActionContext } from '../../../framework/src/lib/test';
import { manychatTransport } from '../src/lib/common/client';

export function stubManychat({ replies }: { replies: FakeReply[] }): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.spyOn(manychatTransport, 'getDispatcher').mockResolvedValue(FAKE_DISPATCHER);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.stubGlobal('fetch', async (input: string | URL, init: RequestInit) => {
    const url = String(input);
    const parsed = new URL(url);
    const rawBody = typeof init.body === 'string' ? init.body : null;
    seen.push({
      url,
      method: String(init.method ?? 'GET'),
      path: parsed.pathname,
      query: parsed.searchParams,
      headers: new Headers(init.headers),
      rawBody,
      body: rawBody === null ? undefined : JSON.parse(rawBody),
      hasDispatcher: Reflect.get(init, 'dispatcher') === FAKE_DISPATCHER,
      redirect: init.redirect,
    });
    const reply = replies[Math.min(seen.length - 1, replies.length - 1)];
    if (reply.networkError) {
      throw new TypeError('fetch failed');
    }
    const status = reply.status ?? 200;
    const text = reply.body === undefined ? null : JSON.stringify(reply.body);
    return new Response(text, { status, headers: { 'content-type': 'application/json' } });
  });
  return seen;
}

export function actionContext({ propsValue }: { propsValue: Record<string, unknown> }) {
  return { ...createMockActionContext({ propsValue }), auth: AUTH };
}

export function errorMessage({ error }: { error: unknown }): string {
  return error instanceof Error ? error.message : String(error);
}

export function ok({ data }: { data?: unknown } = {}): FakeReply {
  return { body: data === undefined ? { status: 'success' } : { status: 'success', data } };
}

const FAKE_DISPATCHER = { fake: true };

export const API_KEY = '1234567:abcdef0123456789';

export const AUTH = { type: AppConnectionType.SECRET_TEXT, secret_text: ` ${API_KEY} ` };

export const SUBSCRIBER_ID = '1234567890123';

export const SUBSCRIBER = {
  id: SUBSCRIBER_ID,
  page_id: '1234567',
  first_name: 'Ada',
  last_name: 'Test',
  name: 'Ada Test',
  email: 'ada@example.com',
  tags: [{ id: 11, name: 'ap-test' }],
  custom_fields: [{ id: 21, name: 'ap_text', type: 'text', description: '', value: 'hello' }],
};

export const CUSTOM_FIELDS = [
  { id: 21, name: 'ap_text', type: 'text', description: '' },
  { id: 22, name: 'ap_num', type: 'number', description: '' },
  { id: 23, name: 'ap_date', type: 'date', description: '' },
  { id: 24, name: 'ap_dt', type: 'datetime', description: '' },
  { id: 25, name: 'ap_bool', type: 'boolean', description: '' },
  { id: 26, name: 'ap_list', type: 'array', description: '' },
];

export type SeenRequest = {
  url: string;
  method: string;
  path: string;
  query: URLSearchParams;
  headers: Headers;
  rawBody: string | null;
  body: unknown;
  hasDispatcher: boolean;
  redirect: RequestRedirect | undefined;
};

export type FakeReply = { status?: number; body?: unknown; networkError?: boolean };
