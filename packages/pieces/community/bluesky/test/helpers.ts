import {
  ActionContext,
  AppConnectionType,
  InputPropertyMap,
  StaticPropsValue,
  TriggerHookContext,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { vi } from 'vitest';
import { createMockActionContext, createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { blueskyAuth } from '../src/lib/common/auth';
import { blueskyClient } from '../src/lib/common/client';

export const ME_DID = 'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa';
export const ME_HANDLE = 'me.bsky.social';
export const OTHER_DID = 'did:plc:bbbbbbbbbbbbbbbbbbbbbbbb';
export const OTHER_HANDLE = 'other.bsky.social';
export const CID = 'bafyreib2rxk3vcfbqij7y6kzgy4knknc7ff4t5jn2m5fbn6jdl7czfqyqe';

export function fakeJwt({ expSeconds }: { expSeconds: number }): string {
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  return `${encode({ alg: 'ES256K' })}.${encode({ exp: expSeconds, sub: ME_DID })}.sig`;
}

export function installFakeBluesky({ routes }: { routes: Record<string, RouteHandler> }) {
  const calls: RecordedCall[] = [];
  blueskyClient.clearAgentCache();
  const allRoutes: Record<string, RouteHandler> = {
    'com.atproto.server.createSession': () =>
      json({
        did: ME_DID,
        handle: ME_HANDLE,
        accessJwt: fakeJwt({ expSeconds: Math.floor(Date.now() / 1000) + 3600 }),
        refreshJwt: fakeJwt({ expSeconds: Math.floor(Date.now() / 1000) + 86400 }),
        active: true,
      }),
    ...routes,
  };
  const fetchMock = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(String(input), init);
    const url = new URL(request.url);
    const nsid = url.pathname.replace('/xrpc/', '');
    const bodyText = request.method === 'GET' ? '' : await request.text();
    const body: unknown = bodyText && !bodyText.startsWith('\u0000') ? safeJson(bodyText) : undefined;
    const call: RecordedCall = { nsid, method: request.method, query: url.searchParams, body, host: url.host };
    calls.push(call);
    const handler = allRoutes[nsid];
    if (!handler) {
      return xrpcError({ status: 501, error: 'MethodNotImplemented', message: `no fake for ${nsid}` });
    }
    return handler(call);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock, callsTo: (nsid: string) => calls.filter((call) => call.nsid === nsid) };
}

export function json(value: unknown): Response {
  return new Response(JSON.stringify(value), { status: 200, headers: { 'content-type': 'application/json' } });
}

export function xrpcError({ status, error, message, headers = {} }: { status: number; error: string; message: string; headers?: Record<string, string> }): Response {
  return new Response(JSON.stringify({ error, message }), { status, headers: { 'content-type': 'application/json', ...headers } });
}

export function postView({ rkey, did = OTHER_DID, handle = OTHER_HANDLE, text = 'hello', indexedAt = '2026-10-05T10:00:00.000Z', viewer = {}, extra = {} }: PostViewArgs) {
  return {
    uri: `at://${did}/app.bsky.feed.post/${rkey}`,
    cid: CID,
    author: { did, handle, displayName: 'Someone' },
    record: { $type: 'app.bsky.feed.post', text, createdAt: indexedAt },
    indexedAt,
    likeCount: 1,
    repostCount: 0,
    replyCount: 0,
    quoteCount: 0,
    viewer,
    labels: [],
    ...extra,
  };
}

export function profileView({ did = OTHER_DID, handle = OTHER_HANDLE, viewer = {} }: { did?: string; handle?: string; viewer?: Record<string, unknown> } = {}) {
  return { did, handle, displayName: 'Other', viewer, labels: [], indexedAt: '2026-01-01T00:00:00.000Z', createdAt: '2024-01-01T00:00:00.000Z' };
}

export function testAuth({ password = 'app-pass-1234' }: { password?: string } = {}) {
  return {
    type: AppConnectionType.CUSTOM_AUTH as const,
    props: { pdsHost: 'https://bsky.social', identifier: ME_HANDLE, password },
  };
}

export function runAction<Props extends InputPropertyMap>({
  action,
  propsValue,
}: {
  action: { run: (context: ActionContext<typeof blueskyAuth, Props>) => Promise<unknown> };
  propsValue: StaticPropsValue<Props>;
}) {
  return action.run({ ...createMockActionContext<Props>({ propsValue }), auth: testAuth() });
}

export function triggerContext<Props extends InputPropertyMap>({
  propsValue,
  store,
  isRepublish,
}: {
  propsValue: StaticPropsValue<Props>;
  store: Map<string, string>;
  isRepublish?: boolean;
}): TriggerHookContext<typeof blueskyAuth, Props, TriggerStrategy.POLLING> {
  return {
    ...createMockPollingTriggerContext<Props>({ propsValue }),
    auth: testAuth(),
    isRepublish,
    store: {
      put: async <T>(key: string, value: T) => {
        store.set(key, JSON.stringify(value));
        return value;
      },
      get: async <T>(key: string): Promise<T | null> => {
        const raw = store.get(key);
        return raw === undefined ? null : JSON.parse(raw);
      },
      delete: async (key: string) => {
        store.delete(key);
      },
    },
  };
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export type RecordedCall = { nsid: string; method: string; query: URLSearchParams; body: unknown; host: string };
export type RouteHandler = (call: RecordedCall) => Response | Promise<Response>;
type PostViewArgs = { rkey: string; did?: string; handle?: string; text?: string; indexedAt?: string; viewer?: Record<string, unknown>; extra?: Record<string, unknown> };
