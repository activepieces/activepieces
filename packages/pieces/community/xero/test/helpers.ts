import { AppConnectionType } from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { createMockActionContext } from '../../../framework/src/lib/test';

export function oauthAuth() {
  return {
    type: AppConnectionType.OAUTH2,
    access_token: 'tok_test',
    client_id: 'client',
    client_secret: 'secret',
    redirect_url: 'https://example.com/redirect',
    token_type: 'Bearer',
    claimed_at: 0,
    refresh_token: 'refresh',
    scope: 'openid',
    token_url: 'https://identity.xero.com/connect/token',
    data: {},
  };
}

export function jsonResponse({ status, body }: { status: number; body: unknown }) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function stubFetch({ status, body }: { status: number; body: unknown }) {
  const fetchMock = vi.fn(async () => jsonResponse({ status, body }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function requestedUrl({ fetchMock, call = 0 }: { fetchMock: ReturnType<typeof vi.fn>; call?: number }) {
  const input = fetchMock.mock.calls[call]?.[0];
  return typeof input === 'string' ? input : String(input);
}

export function requestedHeaders({ fetchMock, call = 0 }: { fetchMock: ReturnType<typeof vi.fn>; call?: number }) {
  const init = fetchMock.mock.calls[call]?.[1];
  return new Headers(init?.headers);
}

export function runAction({
  action,
  propsValue,
}: {
  action: { run: (context: never) => Promise<unknown> };
  propsValue: Record<string, unknown>;
}): Promise<unknown> {
  const context = { ...createMockActionContext({ propsValue: {} }), propsValue, auth: oauthAuth() };
  return Reflect.apply(action.run, action, [context]);
}

export function stubFetchSequence({ responses }: { responses: { status: number; body: unknown }[] }) {
  let call = 0;
  const fetchMock = vi.fn(async () => {
    const response = responses[Math.min(call, responses.length - 1)];
    call += 1;
    return jsonResponse(response);
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function requestedBody({ fetchMock, call = 0 }: { fetchMock: ReturnType<typeof vi.fn>; call?: number }): unknown {
  const init = fetchMock.mock.calls[call]?.[1];
  const body = init?.body;
  return typeof body === 'string' ? JSON.parse(body) : body;
}

export function requestedRawBody({ fetchMock, call = 0 }: { fetchMock: ReturnType<typeof vi.fn>; call?: number }): unknown {
  return fetchMock.mock.calls[call]?.[1]?.body;
}

export function requestedMethod({ fetchMock, call = 0 }: { fetchMock: ReturnType<typeof vi.fn>; call?: number }): string | undefined {
  return fetchMock.mock.calls[call]?.[1]?.method;
}

export function memoryStore({ initial = {} }: { initial?: Record<string, unknown> } = {}) {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    store: {
      put: async (key: string, value: unknown) => {
        data.set(key, value);
        return value;
      },
      get: async (key: string): Promise<unknown> => (data.has(key) ? data.get(key) : null),
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

export function runHook({
  trigger,
  hook,
  context,
}: {
  trigger: object;
  hook: 'run' | 'test' | 'onEnable' | 'onDisable' | 'onHandshake';
  context: Record<string, unknown>;
}): Promise<unknown> {
  const fn: unknown = Reflect.get(trigger, hook);
  if (typeof fn !== 'function') throw new Error(`Trigger has no ${hook}`);
  return Reflect.apply(fn, trigger, [
    {
      auth: oauthAuth(),
      server: { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', token: 'test' },
      files: { write: async () => 'file-url' },
      setSchedule: () => undefined,
      ...context,
    },
  ]);
}
