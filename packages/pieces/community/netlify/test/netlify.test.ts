import { createHash, createHmac } from 'crypto';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { netlifyClient, NetlifyApiError } from '../src/lib/common/client';
import { netlifyOperations } from '../src/lib/common/operations';
import { netlifyWebhook } from '../src/lib/common/webhook';

const auth = { access_token: 'token-123' };
const SITE = { id: 'site-1', account_id: 'acc-1', name: 'my-site', jwt_secret: 'should-not-leak' };

function sign({ secret, body, alg = 'HS256', iss = 'netlify' }: { secret: string; body: string; alg?: string; iss?: string }): string {
  const header = Buffer.from(JSON.stringify({ alg, typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({ iss, sha256: createHash('sha256').update(body).digest('hex') })).toString('base64url');
  const signature = createHmac('sha256', secret).update(`${header}.${claims}`).digest('base64url');
  return `${header}.${claims}.${signature}`;
}

function memoryStore(initial: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = { ...initial };
  return {
    data,
    put: async (key: string, value: unknown) => {
      data[key] = value;
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => (key in data ? Reflect.get(data, key) : null),
    delete: async (key: string) => {
      delete data[key];
    },
  };
}

function slowStore() {
  const base = memoryStore();
  const tick = () => new Promise((resolve) => setTimeout(resolve, Math.random() * 5));
  return {
    ...base,
    put: async (key: string, value: unknown) => {
      await tick();
      return base.put(key, value);
    },
    get: async <T>(key: string): Promise<T | null> => {
      await tick();
      return base.get<T>(key);
    },
  };
}

function httpFailure({ status, body }: { status: number; body: unknown }) {
  return new HttpError({ secret: 'x' }, { status, responseBody: body });
}

type Route = { method: string; path: string; status?: number; body?: unknown };

function mockRoutes(routes: Route[]) {
  const calls: { method: string; url: string; query: unknown; body: unknown; redact: boolean | undefined }[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    const url = new URL(request.url);
    calls.push({ method: request.method, url: request.url, query: request.queryParams, body: request.body, redact: request.redactBodyInErrors });
    const route = routes.find((r) => r.method === request.method && url.pathname === `/api/v1${r.path}`);
    if (!route) throw new Error(`unexpected ${request.method} ${url.pathname}`);
    if ((route.status ?? 200) >= 400) throw httpFailure({ status: route.status ?? 500, body: route.body });
    return { status: route.status ?? 200, headers: {}, body: route.body };
  });
  return calls;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('webhook signature', () => {
  const secret = 'a'.repeat(64);
  const body = JSON.stringify({ id: 'dep-1', state: 'ready' });

  it('accepts a valid Netlify JWS', () => {
    expect(netlifyWebhook.verifySignature({ token: sign({ secret, body }), secret, rawBody: body })).toBe(true);
  });
  it('rejects a wrong secret, a changed body, another issuer, alg none and a missing token', () => {
    expect(netlifyWebhook.verifySignature({ token: sign({ secret: 'b'.repeat(64), body }), secret, rawBody: body })).toBe(false);
    expect(netlifyWebhook.verifySignature({ token: sign({ secret, body }), secret, rawBody: `${body} ` })).toBe(false);
    expect(netlifyWebhook.verifySignature({ token: sign({ secret, body, iss: 'other' }), secret, rawBody: body })).toBe(false);
    expect(netlifyWebhook.verifySignature({ token: sign({ secret, body, alg: 'none' }), secret, rawBody: body })).toBe(false);
    expect(netlifyWebhook.verifySignature({ token: undefined, secret, rawBody: body })).toBe(false);
    expect(netlifyWebhook.verifySignature({ token: sign({ secret, body }), secret, rawBody: null })).toBe(false);
  });
});

describe('webhook receive', () => {
  const secret = 'c'.repeat(64);
  const body = { id: 'dep-1', state: 'ready' };
  const rawBody = JSON.stringify(body);

  it('drops deliveries with a bad signature', async () => {
    const store = memoryStore({ webhook_signature_secret: secret });
    const items = await netlifyWebhook.receive({ payload: { body, rawBody, headers: { 'x-webhook-signature': 'x.y.z' } }, store });
    expect(items).toEqual([]);
  });
  it('emits a signed delivery once and drops the retry inside 15 minutes', async () => {
    const store = memoryStore({ webhook_signature_secret: secret });
    const payload = { body, rawBody, headers: { 'X-Webhook-Signature': sign({ secret, body: rawBody }) } };
    const emitted = { ...body, _dedupe_key: 'netlify:dep-1:ready' };
    expect(await netlifyWebhook.receive({ payload, store, now: 1_000 })).toEqual([emitted]);
    expect(await netlifyWebhook.receive({ payload, store, now: 1_000 + 60_000 })).toEqual([]);
    expect(await netlifyWebhook.receive({ payload, store, now: 1_000 + 16 * 60_000 })).toEqual([emitted]);
  });
  it('treats another state of the same deploy as a new event', async () => {
    const store = memoryStore();
    expect(await netlifyWebhook.receive({ payload: { body: { id: 'dep-2', state: 'building' } }, store })).toHaveLength(1);
    expect(await netlifyWebhook.receive({ payload: { body: { id: 'dep-2', state: 'ready' } }, store })).toHaveLength(1);
  });
  it('accepts unsigned deliveries for hooks created before signing existed', async () => {
    const store = memoryStore();
    expect(await netlifyWebhook.receive({ payload: { body }, store })).toHaveLength(1);
  });
  it('tags parallel deliveries of the same event with one platform dedupe key', async () => {
    const store = slowStore();
    const payload = { body: { id: 'sub-1' } };
    const results = await Promise.all([netlifyWebhook.receive({ payload, store }), netlifyWebhook.receive({ payload, store })]);
    const emitted = results.flat();
    expect(emitted.length).toBeGreaterThanOrEqual(1);
    expect(new Set(emitted.map((item) => Reflect.get(Object(item), '_dedupe_key')))).toEqual(new Set(['netlify:sub-1']));
    expect(await netlifyWebhook.receive({ payload, store })).toEqual([]);
  });
  it('never drops parallel deliveries of different events', async () => {
    const store = slowStore();
    const ids = Array.from({ length: 20 }, (_, i) => `sub-${i}`);
    const results = await Promise.all(ids.map((id) => netlifyWebhook.receive({ payload: { body: { id } }, store })));
    expect(results.every((items) => items.length === 1)).toBe(true);
    const again = await Promise.all(ids.map((id) => netlifyWebhook.receive({ payload: { body: { id } }, store })));
    expect(again.flat().every((item) => Reflect.get(Object(item), '_dedupe_key') !== undefined)).toBe(true);
  });
});

describe('webhook enable/disable', () => {
  it('creates a signed hook, stores its secret and removes everything on disable', async () => {
    const calls = mockRoutes([
      { method: 'POST', path: '/hooks', status: 201, body: { id: 'hook-1' } },
      { method: 'DELETE', path: '/hooks/hook-1', status: 404, body: { message: 'Not Found' } },
    ]);
    const store = memoryStore();
    await netlifyWebhook.enable({ auth, siteId: 'site-1', event: 'deploy_created', webhookUrl: 'https://ap.example/hook', store });
    const sentSecret = Reflect.get(Reflect.get(Object(calls[0].body), 'data'), 'signature_secret');
    expect(sentSecret).toMatch(/^[0-9a-f]{64}$/);
    expect(store.data['webhook_signature_secret']).toBe(sentSecret);
    expect(calls[0].redact).toBe(true);
    expect(calls[0].query).toEqual({ site_id: 'site-1' });
    await netlifyWebhook.disable({ auth, store });
    expect(store.data).toEqual({});
  });
});

describe('error mapper', () => {
  it('uses the Netlify message and a hint', () => {
    const error = netlifyClient.toApiError({ status: 404, body: { code: 404, message: 'Not Found' }, redact: false });
    expect(error).toBeInstanceOf(NetlifyApiError);
    expect(error.message).toBe('Netlify API error (404): Not Found. Check the ID; the resource does not exist or is not visible to this account.');
    expect(error.responseBody).toEqual({ code: 404, message: 'Not Found' });
  });
  it('drops the response body when redacting', () => {
    expect(netlifyClient.toApiError({ status: 422, body: { message: 'bad' }, redact: true }).responseBody).toBeUndefined();
  });
});

describe('env vars', () => {
  it('creates a missing variable with POST', async () => {
    const calls = mockRoutes([
      { method: 'GET', path: '/sites/site-1', body: SITE },
      { method: 'GET', path: '/accounts/acc-1/env/API_URL', status: 404, body: { message: 'Not Found' } },
      { method: 'POST', path: '/accounts/acc-1/env', status: 201, body: [{ key: 'API_URL', scopes: ['builds'], is_secret: false, values: [{ context: 'all', value: 'v' }] }] },
    ]);
    const result = await netlifyOperations.setEnvVar({ auth, siteId: 'site-1', key: 'API_URL', value: 'v' });
    expect(result).toEqual({ key: 'API_URL', created: true, context: 'all', scopes: ['builds'], is_secret: false, contexts: ['all'] });
    expect(JSON.stringify(result)).not.toContain('"v"');
    expect(calls[2].redact).toBe(true);
  });
  it('replaces an existing variable with PUT for all contexts and PATCHes one context', async () => {
    const existing = { key: 'API_URL', scopes: ['builds'], is_secret: false, values: [] };
    const calls = mockRoutes([
      { method: 'GET', path: '/sites/site-1', body: SITE },
      { method: 'GET', path: '/accounts/acc-1/env/API_URL', body: existing },
      { method: 'PUT', path: '/accounts/acc-1/env/API_URL', body: { ...existing, values: [{ context: 'all' }] } },
      { method: 'PATCH', path: '/accounts/acc-1/env/API_URL', body: { ...existing, values: [{ context: 'production' }] } },
    ]);
    expect((await netlifyOperations.setEnvVar({ auth, siteId: 'site-1', key: 'API_URL', value: 'v', context: 'all' })).created).toBe(false);
    await netlifyOperations.setEnvVar({ auth, siteId: 'site-1', key: 'API_URL', value: 'v', context: 'production' });
    expect(calls.map((c) => c.method)).toEqual(['GET', 'GET', 'PUT', 'GET', 'GET', 'PATCH']);
    expect(calls[5].body).toEqual({ context: 'production', value: 'v' });
  });
  it('refuses a secret for all contexts and bad keys before any request', async () => {
    const calls = mockRoutes([]);
    await expect(netlifyOperations.setEnvVar({ auth, siteId: 'site-1', key: 'K', value: 'v', isSecret: true })).rejects.toThrow('specific deploy context');
    await expect(netlifyOperations.setEnvVar({ auth, siteId: 'site-1', key: '1BAD', value: 'v' })).rejects.toThrow('Key must start');
    expect(calls).toHaveLength(0);
  });
  it('reports already_deleted when the key does not exist', async () => {
    const calls = mockRoutes([
      { method: 'GET', path: '/sites/site-1', body: SITE },
      { method: 'GET', path: '/accounts/acc-1/env/OLD', status: 404, body: { message: 'Not Found' } },
    ]);
    expect(await netlifyOperations.deleteEnvVar({ auth, siteId: 'site-1', key: 'OLD' })).toEqual({ key: 'OLD', deleted: false, already_deleted: true });
    expect(calls.some((c) => c.method === 'DELETE')).toBe(false);
  });
});

describe('sites and builds', () => {
  it('drops jwt_secret from site output', async () => {
    mockRoutes([{ method: 'GET', path: '/sites/site-1', body: SITE }]);
    expect(await netlifyOperations.getSite({ auth, siteId: 'site-1' })).not.toHaveProperty('jwt_secret');
  });
  it('explains a 404 from the builds endpoint as a site without a repository', async () => {
    mockRoutes([
      { method: 'GET', path: '/sites/site-1', body: SITE },
      { method: 'POST', path: '/sites/site-1/builds', status: 404, body: { message: 'Not Found' } },
    ]);
    await expect(netlifyOperations.startBuild({ auth, siteId: 'site-1' })).rejects.toThrow('not linked to a Git repository');
  });
});

describe('custom api call paths', () => {
  it('accepts relative paths and same-origin URLs', () => {
    expect(netlifyClient.apiPath('/sites')).toBe('/sites');
    expect(netlifyClient.apiPath('sites/abc/deploys?page=2')).toBe('/sites/abc/deploys?page=2');
    expect(netlifyClient.apiPath('https://api.netlify.com/api/v1/hooks')).toBe('/hooks');
  });
  it.each([
    'https://api.netlify.com.evil.io/api/v1/sites',
    'https://evil.io/api/v1/sites',
    '//evil.io/sites',
    'http://api.netlify.com/api/v1/sites',
    'https://user@api.netlify.com/api/v1/sites',
    'https://api.netlify.com/other',
    '',
  ])('refuses %s', (url) => {
    expect(() => netlifyClient.apiPath(url)).toThrow();
  });
  it('keeps the request body out of logs when Netlify rejects a custom call', async () => {
    const { customApiCall } = await import('../src/lib/actions/custom-api-call');
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'Invalid' }), { status: 422, headers: { 'content-type': 'application/json' } })));
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const props = { url: '/accounts/acc-1/env', method: HttpMethod.POST, headers: {}, queryParams: {}, body: { key: 'API_KEY', value: 'super-secret-value' } };
    await expect(Reflect.apply(customApiCall.run, undefined, [{ auth, propsValue: props }])).rejects.toThrow('Netlify API error (422): Invalid.');
    expect(JSON.stringify(logged.mock.calls.map((call) => call.map(String)))).not.toContain('super-secret-value');
  });
  it('never lets a header replace the connection token', async () => {
    const calls: { headers: unknown }[] = [];
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      calls.push({ headers: request.headers });
      return { status: 200, headers: {}, body: {} };
    });
    await netlifyClient.request({ auth, method: HttpMethod.GET, path: '/user', extraHeaders: { authorization: 'Bearer other', 'X-Extra': '1' } });
    expect(calls[0].headers).toEqual({ Accept: 'application/json', 'X-Extra': '1', Authorization: 'Bearer token-123' });
  });
});
