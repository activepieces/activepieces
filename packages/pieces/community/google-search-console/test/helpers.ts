import { vi } from 'vitest';

export const TOKEN = 'ya29.test-token';

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
      const request: SeenRequest = {
        url,
        method: (init?.method ?? 'GET').toUpperCase(),
        rawPath: url.slice(parsed.origin.length).split('?')[0],
        query: parsed.searchParams,
        headers,
        json: text ? JSON.parse(text) : null,
      };
      seen.push(request);
      const reply = respond(request, seen.length - 1);
      return new Response(reply.body === undefined ? null : JSON.stringify(reply.body), {
        status: reply.status ?? 200,
        headers: { 'content-type': 'application/json' },
      });
    }),
  );
  return seen;
}

export function context(propsValue: Record<string, unknown>) {
  return {
    auth: { access_token: TOKEN },
    propsValue,
    store: {},
    files: {},
    server: { apiUrl: '', publicUrl: '', token: '' },
    run: { id: 'run-1' },
    step: { name: 'step_1' },
  };
}

export function googleError({ code, message, reason, status }: { code: number; message: string; reason?: string; status?: string }) {
  return {
    error: {
      code,
      message,
      errors: [{ message, domain: 'global', reason: reason ?? 'forbidden' }],
      ...(status ? { status } : {}),
    },
  };
}

export const SITE = 'https://ap-gsc-delete-test.example.com/';
export const SITE_ENCODED = 'https%3A%2F%2Fap-gsc-delete-test.example.com%2F';

export type SeenRequest = {
  url: string;
  method: string;
  rawPath: string;
  query: URLSearchParams;
  headers: Headers;
  json: unknown;
};

export type FakeReply = { status?: number; body?: unknown };
