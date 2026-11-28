import { afterEach, describe, expect, test, vi } from 'vitest';
import { BeehiivApiError, beehiivClient, buildUrl, pathFor } from '../src/lib/common/client';
import { API_KEY, PUB, errorMessage, stubBeehiiv } from './helpers';

afterEach(() => vi.restoreAllMocks());

describe('beehiiv client', () => {
  test('sends a trimmed bearer key, JSON accept, verified-TLS dispatcher and no redirects', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [] } }] });
    await beehiivClient.request({ apiKey: ` ${API_KEY} `, method: 'GET', path: '/publications', operation: 'x' });
    expect(seen[0].url).toBe('https://api.beehiiv.com/v2/publications');
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${API_KEY}`);
    expect(seen[0].headers.get('accept')).toBe('application/json');
    expect(seen[0].hasDispatcher).toBe(true);
    expect(seen[0].redirect).toBe('manual');
  });

  test('repeats bracketed array params and drops empty values', () => {
    const url = new URL(buildUrl({ path: '/x', query: { 'content_tags[]': ['a', 'b'], 'expand[]': ['stats'], status: '', limit: 5, cursor: undefined } }));
    expect(url.searchParams.getAll('content_tags[]')).toEqual(['a', 'b']);
    expect(url.searchParams.getAll('expand[]')).toEqual(['stats']);
    expect(url.searchParams.has('status')).toBe(false);
    expect(url.searchParams.has('cursor')).toBe(false);
    expect(url.searchParams.get('limit')).toBe('5');
  });

  test('encodes every path segment, including a plus-addressed email', () => {
    expect(pathFor(['publications', PUB, 'subscriptions', 'by_email', 'a+b@x.com'])).toBe(`/publications/${PUB}/subscriptions/by_email/a%2Bb%40x.com`);
    expect(pathFor(['publications', '../evil'])).toBe('/publications/..%2Fevil');
  });

  test('refuses absolute, traversal or query-carrying paths', () => {
    expect(() => buildUrl({ path: '//evil.io/x' })).toThrow('unexpected path');
    expect(() => buildUrl({ path: '/a/../b' })).toThrow('unexpected path');
    expect(() => buildUrl({ path: 'https://evil.io' })).toThrow('unexpected path');
    expect(() => buildUrl({ path: '/a?x=1' })).toThrow('unexpected path');
  });

  test('error carries status, code and vendor text but never the request body or a body field', async () => {
    stubBeehiiv({ replies: [{ status: 404, body: { status: 404, errors: [{ message: "Couldn't find subscriber", code: 'RECORD_NOT_FOUND' }] } }] });
    const error = await beehiivClient
      .request({ apiKey: API_KEY, method: 'PUT', path: '/x', operation: 'update subscription', body: { email: 'secret-pii@example.com' } })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(BeehiivApiError);
    expect(Reflect.get(Object(error), 'status')).toBe(404);
    expect(Reflect.get(Object(error), 'code')).toBe('RECORD_NOT_FOUND');
    expect(errorMessage({ error })).toContain("Couldn't find subscriber");
    expect(errorMessage({ error })).not.toContain('secret-pii');
    expect(Reflect.has(Object(error), 'body')).toBe(false);
  });

  test('429 on GET waits 10 s and retries twice (the shared client hides 429 headers)', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 429, headers: { 'ratelimit-reset': '1' }, body: { errors: [{ message: 'slow down' }] } }] });
    const waits: number[] = [];
    const error = await beehiivClient
      .request({ apiKey: API_KEY, method: 'GET', path: '/x', operation: 'x', wait: async (ms) => { waits.push(ms); } })
      .catch((e: unknown) => e);
    expect(seen).toHaveLength(3);
    expect(waits).toEqual([10_000, 10_000]);
    expect(errorMessage({ error })).toContain('rate limit');
  });

  test('a failed request never logs the request body', async () => {
    stubBeehiiv({ replies: [{ status: 422, body: { errors: [{ message: 'bad' }] } }] });
    await beehiivClient.request({ apiKey: API_KEY, method: 'POST', path: '/x', operation: 'x', body: { email: 'secret-pii@example.com' } }).catch(() => undefined);
    const logged = vi.mocked(console.error).mock.calls.map((call) => call.map((part) => (part instanceof Error ? part.message : String(part))).join(' ')).join('\n');
    expect(logged).not.toContain('secret-pii');
  });

  test('never retries a POST on 429', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 429 }] });
    await expect(beehiivClient.request({ apiKey: API_KEY, method: 'POST', path: '/x', operation: 'create', body: {}, wait: async () => undefined })).rejects.toThrow('HTTP 429');
    expect(seen).toHaveLength(1);
  });

  test('202 with retryPending waits on Retry-After and retries, then gives up with a clear error', async () => {
    const seen = stubBeehiiv({ replies: [{ status: 202, headers: { 'retry-after': '2' }, body: { data: { state: 'pending' } } }, { body: { data: { id: 'post_1' } } }] });
    const waits: number[] = [];
    const ok = await beehiivClient.request({ apiKey: API_KEY, method: 'GET', path: '/p', operation: 'get post', retryPending: true, wait: async (ms) => { waits.push(ms); } });
    expect(ok.body).toEqual({ data: { id: 'post_1' } });
    expect(waits).toEqual([2_000]);
    expect(seen).toHaveLength(2);
    vi.restoreAllMocks();
    stubBeehiiv({ replies: [{ status: 202, headers: { 'retry-after': '5' } }] });
    await expect(beehiivClient.request({ apiKey: API_KEY, method: 'GET', path: '/p', operation: 'get post', retryPending: true, wait: async () => undefined })).rejects.toThrow('still preparing');
  });

  test('204 returns an undefined body', async () => {
    stubBeehiiv({ replies: [{ status: 204 }] });
    const result = await beehiivClient.request({ apiKey: API_KEY, method: 'DELETE', path: '/x', operation: 'x' });
    expect(result).toEqual({ status: 204, body: undefined });
  });

  test('a redirect is not followed and fails', async () => {
    stubBeehiiv({ replies: [{ status: 302 }] });
    await expect(beehiivClient.request({ apiKey: API_KEY, method: 'GET', path: '/x', operation: 'x' })).rejects.toThrow('HTTP 302');
  });

  test('empty API key is refused before any request', async () => {
    const seen = stubBeehiiv({ replies: [{ body: {} }] });
    await expect(beehiivClient.request({ apiKey: '  ', method: 'GET', path: '/x', operation: 'x' })).rejects.toThrow('empty');
    expect(seen).toHaveLength(0);
  });
});

describe('pagination', () => {
  test('offset listing follows total_pages to the end with limit 100', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [{ id: 1 }], total_pages: 2, page: 1 } }, { body: { data: [{ id: 2 }], total_pages: 2, page: 2 } }] });
    const items = await beehiivClient.listAllPaged({ apiKey: API_KEY, path: '/x', operation: 'x', maxItems: 10 });
    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(seen.map((r) => r.query.get('page'))).toEqual(['1', '2']);
    expect(seen[0].query.get('limit')).toBe('100');
  });

  test('offset listing throws instead of requesting page 101', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [{ id: 1 }], total_pages: 500 } }] });
    await expect(beehiivClient.listAllPaged({ apiKey: API_KEY, path: '/x', operation: 'list x', maxItems: 1_000_000 })).rejects.toThrow('page 100');
    expect(seen).toHaveLength(100);
  });

  test('offset listing throws when more than maxItems match', async () => {
    stubBeehiiv({ replies: [{ body: { data: [{ id: 1 }, { id: 2 }], total_pages: 3 } }] });
    await expect(beehiivClient.listAllPaged({ apiKey: API_KEY, path: '/x', operation: 'x', maxItems: 3 })).rejects.toThrow('more than 3');
  });

  test('cursor listing follows next_cursor while has_more', async () => {
    const seen = stubBeehiiv({
      replies: [
        { body: { data: [{ id: 1 }], has_more: true, next_cursor: 'c2' } },
        { body: { data: [{ id: 2 }], has_more: false, next_cursor: null } },
      ],
    });
    const items = await beehiivClient.listAllCursor({ apiKey: API_KEY, path: '/x', operation: 'x', maxItems: 10 });
    expect(items).toEqual([{ id: 1 }, { id: 2 }]);
    expect(seen[0].query.has('cursor')).toBe(false);
    expect(seen[1].query.get('cursor')).toBe('c2');
  });

  test('cursor listing stops at the deadline with an error', async () => {
    stubBeehiiv({ replies: [{ body: { data: [{ id: 1 }], has_more: true, next_cursor: 'c' } }] });
    let clock = 0;
    await expect(
      beehiivClient.listAllCursor({ apiKey: API_KEY, path: '/x', operation: 'x', maxItems: 1_000, deadlineMs: 1_000, now: () => (clock += 600) }),
    ).rejects.toThrow('longer than');
  });

  test('one offset page reports has_more from total_pages', async () => {
    stubBeehiiv({ replies: [{ body: { data: [{ id: 1 }], page: 1, limit: 1, total_pages: 3, total_results: 3 } }] });
    const page = await beehiivClient.listPage({ apiKey: API_KEY, path: '/x', operation: 'x', page: 1, limit: 1 });
    expect(page).toEqual({ items: [{ id: 1 }], page: 1, limit: 1, total_pages: 3, total_results: 3, has_more: true });
  });
});

describe('QA: client error edge cases', () => {
  test('a non-JSON error body is kept as truncated text and the 401 message says reconnect', async () => {
    stubBeehiiv({ replies: [{ status: 401, body: 'x'.repeat(2000) }] });
    const error = await beehiivClient.request({ apiKey: API_KEY, method: 'GET', path: '/publications', operation: 'probe' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(BeehiivApiError);
    expect(errorMessage({ error })).toContain('reconnect beehiiv');
    expect(errorMessage({ error }).length).toBeLessThan(700);
  });

  test('a 500 error never echoes the request body', async () => {
    stubBeehiiv({ replies: [{ status: 500, body: { errors: [{ message: 'boom' }] } }] });
    const error = await beehiivClient
      .request({ apiKey: API_KEY, method: 'POST', path: `/publications/${PUB}/subscriptions`, operation: 'create', body: { email: 'secret-pii@x.com' } })
      .catch((caught: unknown) => caught);
    expect(errorMessage({ error })).toContain('boom');
    expect(errorMessage({ error })).not.toContain('secret-pii');
    expect(JSON.stringify(error)).not.toContain('secret-pii');
  });
});
