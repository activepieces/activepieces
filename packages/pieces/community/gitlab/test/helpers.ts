import { MockAgent } from 'undici';
import { vi } from 'vitest';
import { gitlabTransport } from '../src/lib/common/secret-request';

export const FAKE_DISPATCHER = new MockAgent();

export const auth = {
  access_token: 'TOKEN-123',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'http://localhost/redirect',
  token_type: 'Bearer',
  claimed_at: 0,
  refresh_token: 'refresh',
  scope: 'api read_user',
  token_url: 'https://gitlab.com/oauth/token',
  data: {},
};

export type Seen = {
  method: string;
  url: string;
  path: string;
  query: Record<string, string | string[]>;
  headers: Headers;
  body: unknown;
  redirect: RequestRedirect | undefined;
  dispatcher: unknown;
};

export type Reply = {
  status?: number;
  body?: unknown;
  headers?: Record<string, string>;
};

export function stubGitlab(replies: Reply[] | ((seen: Seen) => Reply)): Seen[] {
  const seen: Seen[] = [];
  const queue = Array.isArray(replies) ? [...replies] : undefined;
  vi.spyOn(gitlabTransport, 'getDispatcher').mockResolvedValue(FAKE_DISPATCHER);
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async (input: string, init: RequestInit & { dispatcher?: unknown }) => {
        const url = new URL(input);
        const query: Record<string, string | string[]> = {};
        for (const key of new Set(url.searchParams.keys())) {
          const all = url.searchParams.getAll(key);
          query[key] = key.endsWith('[]') ? all : all[0];
        }
        const entry: Seen = {
          method: init.method ?? 'GET',
          url: url.toString(),
          path: url.pathname.replace('/api/v4', ''),
          query,
          headers: new Headers(init.headers),
          body:
            typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
          redirect: init.redirect,
          dispatcher: init.dispatcher,
        };
        seen.push(entry);
        const reply = Array.isArray(replies)
          ? queue?.shift() ?? { status: 200, body: {} }
          : replies(entry);
        const status = reply.status ?? 200;
        const hasBody = reply.body !== undefined && status !== 204;
        return new Response(
          hasBody
            ? typeof reply.body === 'string'
              ? reply.body
              : JSON.stringify(reply.body)
            : null,
          {
            status,
            headers: {
              ...(hasBody && typeof reply.body !== 'string'
                ? { 'content-type': 'application/json' }
                : {}),
              ...reply.headers,
            },
          }
        );
      }
    )
  );
  return seen;
}

type Runnable = { name: string; run: (ctx: never) => Promise<unknown> };

export async function runAction({
  action,
  propsValue,
}: {
  action: Runnable;
  propsValue: Record<string, unknown>;
}) {
  return Reflect.apply(action.run, action, [{ auth, propsValue }]);
}

export function rawPath(seen: Seen): string {
  return new URL(seen.url).pathname.replace('/api/v4', '');
}
