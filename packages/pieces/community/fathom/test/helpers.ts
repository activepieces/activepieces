import { AppConnectionType } from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { createMockActionContext } from '../../../framework/src/lib/test';

export function oauthAuth() {
  return {
    type: AppConnectionType.OAUTH2 as const,
    access_token: 'tok_test',
    client_id: 'client',
    client_secret: 'secret',
    redirect_url: 'https://example.com/redirect',
    token_type: 'Bearer',
    claimed_at: 0,
    refresh_token: 'refresh',
    scope: 'public_api',
    token_url: 'https://fathom.video/external/v1/oauth2/token',
    data: {},
  };
}

export function apiKeyAuth() {
  return { type: AppConnectionType.SECRET_TEXT as const, secret_text: ' key_test ' };
}

export function runAction({
  action,
  propsValue,
  auth = oauthAuth(),
}: {
  action: { run: (context: never) => Promise<unknown> };
  propsValue: Record<string, unknown>;
  auth?: ReturnType<typeof oauthAuth> | ReturnType<typeof apiKeyAuth>;
}): Promise<unknown> {
  const context = { ...createMockActionContext({ propsValue: {} }), propsValue, auth };
  return Reflect.apply(action.run, action, [context]);
}

export function memoryStore() {
  const data = new Map<string, string>();
  return {
    data,
    store: {
      put: async <T>(key: string, value: T) => {
        data.set(key, JSON.stringify(value));
        return value;
      },
      get: async <T>(key: string): Promise<T | null> => {
        const raw = data.get(key);
        return raw === undefined ? null : JSON.parse(raw);
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

export function jsonResponse({ status = 200, body }: { status?: number; body: unknown }): Response {
  return new Response(body === undefined ? null : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export function installFetch() {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function requestOf({ fetchMock, call }: { fetchMock: ReturnType<typeof vi.fn>; call: number }) {
  const [input, init] = fetchMock.mock.calls[call];
  if (input instanceof Request) {
    return { url: input.url, method: input.method, headers: Object.fromEntries(input.headers.entries()) };
  }
  const headers = new Headers(init?.headers);
  return { url: String(input), method: String(init?.method ?? 'GET'), headers: Object.fromEntries(headers.entries()), body: init?.body };
}

export function meeting(overrides: Record<string, unknown>) {
  return {
    title: 'Weekly Sync',
    meeting_title: 'Weekly Sync',
    recording_id: 111,
    url: 'https://fathom.video/calls/1',
    share_url: 'https://fathom.video/share/1',
    created_at: '2026-10-01T10:00:00Z',
    scheduled_start_time: '2026-10-01T09:00:00Z',
    scheduled_end_time: '2026-10-01T09:30:00Z',
    recording_start_time: '2026-10-01T09:01:00Z',
    recording_end_time: '2026-10-01T09:29:00Z',
    calendar_invitees_domains_type: 'only_internal',
    transcript_language: 'en',
    calendar_invitees: [],
    recorded_by: { name: 'Jane', email: 'jane@example.com', email_domain: 'example.com', team: null },
    ...overrides,
  };
}
