import { vi } from 'vitest';


export const AUTH = { props: { instance_url: 'https://paste.example.com/', token: ' key-1 ' } };

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
        path: parsed.pathname,
        query: parsed.searchParams,
        auth: headers.get('authorization'),
        body: rawBody ? JSON.parse(rawBody) : {},
      };
      seen.push(request);
      const reply = respond(request, seen.length - 1);
      return new Response(JSON.stringify(reply.body ?? {}), { status: reply.status ?? 200, headers: { 'content-type': 'application/json' } });
    }),
  );
  return seen;
}

export function replies(list: FakeReply[]): (request: SeenRequest, index: number) => FakeReply {
  return (_request, index) => list[Math.min(index, list.length - 1)];
}

export function run(action: { run: (...args: never[]) => unknown }) {
  return (propsValue: Record<string, unknown>, auth: unknown = AUTH): Promise<unknown> =>
    Promise.resolve(Reflect.apply(action.run, action, [{ auth, propsValue }]));
}

export type SeenRequest = { url: string; method: string; path: string; query: URLSearchParams; auth: string | null; body: Record<string, unknown> };
export type FakeReply = { status?: number; body?: unknown };
