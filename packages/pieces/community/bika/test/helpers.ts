import { vi } from 'vitest';

export const TOKEN = 'bkt_test_token';

export function connection() {
  return { type: 'CUSTOM_AUTH', props: { token: ` ${TOKEN} ` } };
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
      const bytes = Buffer.isBuffer(raw) ? raw.toString('latin1') : '';
      const request: SeenRequest = {
        url,
        method: (init?.method ?? 'GET').toUpperCase(),
        path: parsed.pathname,
        query: parsed.searchParams,
        headers,
        json: text ? JSON.parse(text) : null,
        bytes,
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

export function ok(data: unknown) {
  return { body: { success: true, code: 200, message: 'SUCCESS', data } };
}

export function context(propsValue: Record<string, unknown>) {
  return { auth: connection(), propsValue, store: {}, files: {}, server: { apiUrl: '', publicUrl: '', token: '' } };
}

export const RECORDS_PATH = '/api/openapi/bika/v2/spaces/spc1/resources/databases/dat1/records';

export type SeenRequest = {
  url: string;
  method: string;
  path: string;
  query: URLSearchParams;
  headers: Headers;
  json: unknown;
  bytes: string;
};

export type FakeReply = { status?: number; body?: unknown };
