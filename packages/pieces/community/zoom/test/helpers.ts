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
    scope: '',
    token_url: 'https://zoom.us/oauth/token',
    data: {},
  };
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

export function jsonResponse({ status = 200, body }: { status?: number; body: unknown }): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function emptyResponse({ status = 204 }: { status?: number }): Response {
  return new Response(null, { status });
}

export function installFetch() {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function requestOf({ fetchMock, call }: { fetchMock: ReturnType<typeof vi.fn>; call: number }) {
  const [input, init] = fetchMock.mock.calls[call];
  const headers = new Headers(init?.headers);
  const rawBody = init?.body;
  return {
    url: String(input),
    method: String(init?.method ?? 'GET'),
    headers: Object.fromEntries(headers.entries()),
    body: typeof rawBody === 'string' ? JSON.parse(rawBody) : undefined,
    hasSignal: init?.signal !== undefined,
  };
}
