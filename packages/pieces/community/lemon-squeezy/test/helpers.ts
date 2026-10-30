import { vi } from 'vitest';
import { readPath } from '../src/lib/common/client';

export function jsonResponse({ value, status = 200, headers = {} }: { value: unknown; status?: number; headers?: Record<string, string> }): Response {
  return new Response(status === 204 ? null : JSON.stringify(value), {
    status,
    headers: { 'content-type': 'application/vnd.api+json', ...headers },
  });
}

export function installFetch(routes: Record<string, Handler>) {
  const calls: Call[] = [];
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(String(input));
    const method = (init?.method ?? 'GET').toUpperCase();
    const raw = typeof init?.body === 'string' ? init.body : undefined;
    const call: Call = { method, url, body: parseBody(raw), headers: headersOf(init?.headers) };
    calls.push(call);
    const handler = routes[`${method} ${url.pathname.replace(/^\/v1/, '')}`];
    if (!handler) return jsonResponse({ value: { errors: [{ detail: `no fake for ${method} ${url.pathname}` }] }, status: 501 });
    return handler(call);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}

export function memoryStore(initial: Record<string, unknown> = {}) {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    get: async <T>(key: string): Promise<T | null> => {
      const value: unknown = data.get(key);
      return value === undefined ? null : identity<T>(value);
    },
    put: async <T>(key: string, value: T) => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

export async function runAction({ action, props }: { action: { run: unknown }; props: Record<string, unknown> }) {
  return Reflect.apply(Function.prototype.call, action.run, [action, { auth: AUTH, propsValue: props, store: memoryStore() }]);
}

export function resource({ type, id, attributes = {} }: { type: string; id: string; attributes?: Record<string, unknown> }) {
  return { type, id, attributes };
}

export function attributesOf(call: Call): unknown {
  return readPath({ value: call.body, path: ['data', 'attributes'] });
}

export const AUTH = { secret_text: 'test-key', type: 'SECRET_TEXT' };

function parseBody(raw: string | undefined): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function headersOf(headers: RequestInit['headers']): Record<string, string> {
  return Object.fromEntries(new Headers(headers ?? {}).entries());
}

function identity<T>(value: unknown): T {
  return Reflect.apply((v: unknown) => v, undefined, [value]);
}

export type Call = { method: string; url: URL; body: unknown; headers: Record<string, string> };

type Handler = (call: Call) => Response | Promise<Response>;
