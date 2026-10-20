import { vi } from 'vitest';

export type SeenRequest = { url: URL; method: string; headers: Headers; body: unknown };
export type FakeReply = { status?: number; body?: unknown; headers?: Record<string, string> };

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
      const payload = status === 204 ? null : JSON.stringify(reply.body ?? {});
      return new Response(payload, { status, headers: { 'content-type': 'application/json', ...(reply.headers ?? {}) } });
    }),
  );
  return seen;
}

export function replies(list: FakeReply[]): (request: SeenRequest, index: number) => FakeReply {
  return (_request, index) => list[Math.min(index, list.length - 1)];
}

export function run({ action, props }: { action: Runnable; props: Record<string, unknown> }): Promise<unknown> {
  return action.run({
    auth: { secret_text: ` ${API_KEY} ` },
    propsValue: props,
    server: { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/', token: 'x' },
  });
}

export async function failure(promise: Promise<unknown>): Promise<unknown> {
  return promise.then(
    () => {
      throw new Error('expected a failure');
    },
    (error: unknown) => error,
  );
}

export const API_KEY = 'em_test_key';
export const SEND_REPLY = {
  object: 'email',
  id: 'em_1',
  ids: { 'ada@example.com': 'em_1', 'grace@example.com': 'em_2' },
  from: 'Acme <hello@acme.com>',
  to: ['ada@example.com', 'grace@example.com'],
  subject: 'Hi',
  status: 'accepted',
  scheduled_at: null,
  created_at: '2026-10-12T10:00:00Z',
  tracking: { loads: false, clicks: false },
};

type Runnable = { run(context: never): Promise<unknown> };
