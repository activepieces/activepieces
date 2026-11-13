import { Readable } from 'stream';
import { httpClient, HttpError } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { vi } from 'vitest';

export const AUTH = { access_token: 'figma-token', type: 'OAUTH2' };

export type Call = { method: string; url: string; query: Record<string, string>; body: unknown; headers: Record<string, string>; redact: boolean | undefined; responseType: string | undefined };

export type Route = { method: string; path: string; status?: number; body?: unknown; stream?: Buffer };

export function mockRoutes(routes: Route[]): Call[] {
  const calls: Call[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    const url = new URL(request.url);
    calls.push({
      method: request.method,
      url: request.url,
      query: request.queryParams ?? {},
      body: request.body,
      headers: request.headers ?? {},
      redact: request.redactBodyInErrors,
      responseType: request.responseType,
    });
    const route = routes.find((r) => r.method === request.method && (url.pathname === r.path || request.url === r.path));
    if (!route) throw new Error(`unexpected ${request.method} ${request.url}`);
    const status = route.status ?? 200;
    if (status >= 400) throw new HttpError(request.body, { status, responseBody: route.body });
    if (route.stream) return { status, headers: {}, body: Readable.from([route.stream]) };
    return { status, headers: {}, body: route.body };
  });
  return calls;
}

export function memoryStore(initial: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = { ...initial };
  return {
    data,
    put: async (key: string, value: unknown) => {
      data[key] = value;
      return value;
    },
    get: async (key: string): Promise<unknown> => (key in data ? data[key] : null),
    delete: async (key: string) => {
      delete data[key];
    },
  };
}

export async function runAction({ action, props, extra = {} }: { action: { run: unknown }; props: Record<string, unknown>; extra?: Record<string, unknown> }): Promise<ActionOutput> {
  const base = createMockActionContext({ propsValue: props });
  return invoke({ fn: action.run, ctx: { ...base, auth: AUTH, ...extra } });
}

export async function invoke({ fn, ctx }: { fn: unknown; ctx: unknown }): Promise<ActionOutput> {
  if (typeof fn !== 'function') {
    throw new Error('not a function');
  }
  return fn(ctx);
}

export function passcodeOf(body: unknown): string {
  const value = typeof body === 'object' && body !== null ? Reflect.get(body, 'passcode') : undefined;
  return typeof value === 'string' ? value : '';
}

type ActionOutput = ReturnType<typeof JSON.parse>;
