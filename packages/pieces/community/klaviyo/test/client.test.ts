import { HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  equalsFilter,
  KlaviyoApiError,
  KlaviyoCapError,
  klaviyoApi,
  klaviyoTransport,
  quoteFilterValue,
} from '../src/lib/common/client';

function stub({ replies }: { replies: Reply[] }): Seen[] {
  const seen: Seen[] = [];
  vi.spyOn(klaviyoTransport, 'getDispatcher').mockResolvedValue(DISPATCHER);
  vi.spyOn(klaviyoTransport, 'sleep').mockResolvedValue(undefined);
  vi.stubGlobal('fetch', async (input: string | URL, init: RequestInit) => {
    const url = new URL(String(input));
    seen.push({
      url,
      method: String(init.method),
      headers: new Headers(init.headers),
      body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
      dispatcher: Reflect.get(init, 'dispatcher'),
      redirect: init.redirect,
    });
    const reply = replies[Math.min(seen.length - 1, replies.length - 1)];
    if (reply.network) {
      throw new TypeError('fetch failed');
    }
    const text = reply.body === undefined ? null : JSON.stringify(reply.body);
    return new Response(text, { status: reply.status, headers: reply.headers });
  });
  return seen;
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('klaviyo client', () => {
  test('sends revision, JSON:API headers, encoded path, verified dispatcher and no redirects', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [] } }] });
    await klaviyoApi.send({ auth: AUTH, method: HttpMethod.GET, path: '/lists/a%2Fb/profiles', query: { filter: equalsFilter({ field: 'email', value: 'a@b.com' }) } });
    expect(seen[0].url.origin).toBe('https://a.klaviyo.com');
    expect(seen[0].url.pathname).toBe('/api/lists/a%2Fb/profiles');
    expect(seen[0].url.searchParams.get('filter')).toBe('equals(email,"a@b.com")');
    expect(seen[0].headers.get('revision')).toBe('2026-10-15');
    expect(seen[0].headers.get('accept')).toBe('application/vnd.api+json');
    expect(seen[0].headers.get('authorization')).toBe('Klaviyo-API-Key pk_test');
    expect(seen[0].dispatcher).toBe(DISPATCHER);
    expect(seen[0].redirect).toBe('manual');
  });

  test('oauth connections send a bearer token', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [] } }] });
    await klaviyoApi.send({ auth: { type: AppConnectionType.OAUTH2, access_token: 'tok', data: {}, props: {} }, method: HttpMethod.GET, path: '/lists' });
    expect(seen[0].headers.get('authorization')).toBe('Bearer tok');
  });

  test('filter values escape quotes and backslashes', () => {
    expect(quoteFilterValue('a"b\\c')).toBe('"a\\"b\\\\c"');
  });

  test('refuses unexpected paths', async () => {
    stub({ replies: [{ status: 200, body: {} }] });
    await expect(klaviyoApi.send({ auth: AUTH, method: HttpMethod.GET, path: '//evil.io/x' })).rejects.toThrow('unexpected path');
    await expect(klaviyoApi.send({ auth: AUTH, method: HttpMethod.GET, path: '/lists/../accounts' })).rejects.toThrow('unexpected path');
  });

  test('403 shows the vendor detail and code, never the request body', async () => {
    stub({ replies: [{ status: 403, body: { errors: [{ status: 403, code: 'permission_denied', title: 'Forbidden', detail: 'Missing scope profiles:write' }] } }] });
    const error = await klaviyoApi
      .send({ auth: AUTH, method: HttpMethod.POST, path: '/profiles', body: { data: { attributes: { email: 'secret-pii@example.com' } } } })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(KlaviyoApiError);
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain('Missing scope profiles:write (permission_denied)');
    expect(message).toContain('HTTP 403');
    expect(message).not.toContain('secret-pii');
    expect(message).not.toContain('Authentication failed');
    expect(Reflect.has(error instanceof Error ? error : {}, 'body')).toBe(false);
  });

  test('429 on GET retries twice with a bounded wait (the shared client drops Retry-After on errors)', async () => {
    const seen = stub({ replies: [{ status: 429, body: { errors: [] }, headers: { 'retry-after': '30' } }, { status: 429, body: { errors: [] } }, { status: 200, body: { data: [] } }] });
    await klaviyoApi.send({ auth: AUTH, method: HttpMethod.GET, path: '/lists' });
    expect(seen).toHaveLength(3);
    expect(vi.mocked(klaviyoTransport.sleep).mock.calls).toEqual([[2_000], [5_000]]);
  });

  test('429 on POST is never retried', async () => {
    const seen = stub({ replies: [{ status: 429, body: { errors: [{ detail: 'Throttled' }] }, headers: { 'retry-after': '3' } }] });
    const error = await klaviyoApi.send({ auth: AUTH, method: HttpMethod.POST, path: '/events', body: {} }).catch((caught: unknown) => caught);
    expect(seen).toHaveLength(1);
    expect(error instanceof KlaviyoApiError ? error.status : undefined).toBe(429);
    expect(error instanceof Error ? error.message : '').toContain('Throttled');
  });

  test('requests go through the shared client with the verified dispatcher and a redacted error log', async () => {
    const seen = stub({ replies: [{ status: 400, body: { errors: [{ detail: 'Bad' }] } }] });
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await klaviyoApi.send({ auth: AUTH, method: HttpMethod.POST, path: '/profiles', body: { data: { attributes: { email: 'secret-pii@example.com' } } } }).catch(() => undefined);
    expect(seen[0].dispatcher).toBe(DISPATCHER);
    expect(seen[0].redirect).toBe('manual');
    expect(seen[0].body).toEqual({ data: { attributes: { email: 'secret-pii@example.com' } } });
    expect(JSON.stringify(logged.mock.calls)).not.toContain('secret-pii');
  });

  test('a timeout on POST says it may still have been applied', async () => {
    vi.spyOn(klaviyoTransport, 'getDispatcher').mockResolvedValue(DISPATCHER);
    vi.stubGlobal('fetch', async () => {
      throw new DOMException('This operation was aborted', 'AbortError');
    });
    await expect(klaviyoApi.send({ auth: AUTH, method: HttpMethod.POST, path: '/events', body: {} })).rejects.toThrow(/did not answer within 60 s.*may still have been applied/);
  });

  test('202 and 204 with an empty body succeed', async () => {
    stub({ replies: [{ status: 202 }, { status: 204 }] });
    await expect(klaviyoApi.send({ auth: AUTH, method: HttpMethod.POST, path: '/events', body: {} })).resolves.toEqual({ status: 202, body: undefined });
    await expect(klaviyoApi.send({ auth: AUTH, method: HttpMethod.DELETE, path: '/lists/x' })).resolves.toEqual({ status: 204, body: undefined });
  });

  test('network failure on POST says it may have been applied', async () => {
    stub({ replies: [{ status: 0, network: true }] });
    await expect(klaviyoApi.send({ auth: AUTH, method: HttpMethod.POST, path: '/events', body: {} })).rejects.toThrow(/could not reach a\.klaviyo\.com.*may still have been applied/);
  });

  test('listPage sends the cursor and reads next_cursor from links.next', async () => {
    const seen = stub({ replies: [{ status: 200, body: { data: [{ type: 'list', id: 'L1', attributes: { name: 'One' } }], links: { next: 'https://a.klaviyo.com/api/lists?page%5Bcursor%5D=abc' } } }] });
    const page = await klaviyoApi.listPage({ auth: AUTH, path: '/lists', cursor: 'prev' });
    expect(seen[0].url.searchParams.get('page[cursor]')).toBe('prev');
    expect(page.next_cursor).toBe('abc');
    expect(page.has_more).toBe(true);
    expect(page.items[0].id).toBe('L1');
  });

  test('listAll follows every page and throws at its cap', async () => {
    const pageOf = ({ id, next }: { id: string; next: string | null }) => ({ status: 200, body: { data: [{ type: 'list', id, attributes: {} }], links: { next } } });
    const seen = stub({ replies: [pageOf({ id: 'a', next: 'https://a.klaviyo.com/api/lists?page%5Bcursor%5D=c2' }), pageOf({ id: 'b', next: null })] });
    const all = await klaviyoApi.listAll({ auth: AUTH, path: '/lists', maxItems: 10, what: 'lists' });
    expect(all.items.map((item) => item.id)).toEqual(['a', 'b']);
    expect(seen[1].url.searchParams.get('page[cursor]')).toBe('c2');
    vi.unstubAllGlobals();
    stub({ replies: [pageOf({ id: 'a', next: 'https://a.klaviyo.com/api/lists?page%5Bcursor%5D=c2' })] });
    await expect(klaviyoApi.listAll({ auth: AUTH, path: '/lists', maxItems: 1, what: 'lists' })).rejects.toBeInstanceOf(KlaviyoCapError);
  });
});

const DISPATCHER = { fake: true };

const AUTH: { type: AppConnectionType.SECRET_TEXT; secret_text: string } = { type: AppConnectionType.SECRET_TEXT, secret_text: ' pk_test ' };

type Reply = { status: number; body?: unknown; headers?: Record<string, string>; network?: boolean };

type Seen = { url: URL; method: string; headers: Headers; body: unknown; dispatcher: unknown; redirect: RequestRedirect | undefined };
