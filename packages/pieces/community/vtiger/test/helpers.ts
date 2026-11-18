import { AppConnectionType } from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { VTigerAuthValue } from '../src/lib/common';

export const INSTANCE = 'https://acme.od2.vtiger.com';
export const REST = '/restapi/v1/vtiger/default';

export function creds(overrides: Partial<Creds> = {}): Creds {
  return { instance_url: INSTANCE, username: 'pat@acme.com', password: 'KEY123', ...overrides };
}

export function auth(overrides: Partial<Creds> = {}): VTigerAuthValue {
  return { type: AppConnectionType.CUSTOM_AUTH, props: creds(overrides) };
}

export function ok(result: unknown): Reply {
  return { body: { success: true, result } };
}

export function fail({ code, message, status = 200 }: { code: string; message: string; status?: number }): Reply {
  return { status, body: { success: false, error: { code, message } } };
}

export function vtwsRoutes(extra: Route[] = []): Route[] {
  return [
    { method: 'GET', path: '/webservice.php', operation: 'getchallenge', reply: ok({ token: 'tok', serverTime: 1, expireTime: 2 }) },
    { method: 'POST', path: '/webservice.php', operation: 'login', reply: ok({ sessionName: 'sess1', userId: '19x1' }) },
    ...extra,
  ];
}

export function stubVtiger(routes: Route[]): Seen[] {
  const seen: Seen[] = [];
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit & { dispatcher?: unknown }) => {
      const url = new URL(input instanceof Request ? input.url : String(input));
      const method = (init?.method ?? 'GET').toUpperCase();
      const raw = typeof init?.body === 'string' ? init.body : undefined;
      const headers = new Headers(init?.headers);
      const form =
        raw !== undefined && (headers.get('content-type') ?? '').includes('x-www-form-urlencoded')
          ? Object.fromEntries(new URLSearchParams(raw).entries())
          : undefined;
      const query = Object.fromEntries(url.searchParams.entries());
      const entry: Seen = {
        method,
        url: url.toString(),
        origin: url.origin,
        path: url.pathname,
        query,
        headers,
        raw,
        form,
        dispatcher: init?.dispatcher,
      };
      seen.push(entry);
      const operation = query['operation'] ?? form?.['operation'];
      const route = routes.find(
        (r) =>
          r.method === method &&
          (r.path === url.pathname || r.path === url.pathname.replace(REST, '')) &&
          (r.operation === undefined || r.operation === operation) &&
          (r.match === undefined || r.match(entry))
      );
      if (route === undefined) {
        return new Response(JSON.stringify({ success: false, error: { code: 'NO_STUB', message: `${method} ${url.pathname}` } }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }
      const reply = typeof route.reply === 'function' ? route.reply(entry, seen) : route.reply;
      return new Response(reply.body === undefined ? '' : JSON.stringify(reply.body), {
        status: reply.status ?? 200,
        headers: { 'content-type': 'application/json', ...(reply.headers ?? {}) },
      });
    })
  );
  return seen;
}

export async function runAction({
  action,
  props,
  connection = auth(),
  files,
}: {
  action: { run: (ctx: never) => Promise<unknown> };
  props: Record<string, unknown>;
  connection?: unknown;
  files?: unknown;
}): Promise<unknown> {
  const context = { auth: connection, propsValue: props, files };
  return Reflect.apply(action.run, undefined, [context]);
}

export function basic(c: Creds = creds()): string {
  return `Basic ${Buffer.from(`${c.username}:${c.password}`).toString('base64')}`;
}

export const SERVER = { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' };

export type Creds = { instance_url: string; username: string; password: string };

export type Reply = { status?: number; body?: unknown; headers?: Record<string, string> };

export type Route = {
  method: string;
  path: string;
  operation?: string;
  match?: (seen: Seen) => boolean;
  reply: Reply | ((request: Seen, all: Seen[]) => Reply);
};

export type Seen = {
  method: string;
  url: string;
  origin: string;
  path: string;
  query: Record<string, string>;
  headers: Headers;
  raw: string | undefined;
  form: Record<string, string> | undefined;
  dispatcher: unknown;
};
