import { afterEach, describe, expect, test, vi } from 'vitest';
import { ManychatApiError, manychatClient, manychatUtils } from '../src/lib/common/client';
import { API_KEY, errorMessage, ok, stubManychat } from './helpers';

afterEach(() => vi.restoreAllMocks());

describe('ManyChat client', () => {
  test('sends a trimmed bearer key, JSON accept, the verified-TLS dispatcher and no redirects', async () => {
    const seen = stubManychat({ replies: [ok({ data: {} })] });
    await manychatClient.request({ apiKey: ` ${API_KEY} `, method: 'GET', path: '/page/getInfo', operation: 'x' });
    expect(seen[0].url).toBe('https://api.manychat.com/fb/page/getInfo');
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${API_KEY}`);
    expect(seen[0].headers.get('accept')).toBe('application/json');
    expect(seen[0].hasDispatcher).toBe(true);
    expect(seen[0].redirect).toBe('manual');
  });

  test('apiKeyOf reads a plain string and a SecretText object, never the object itself', () => {
    expect(manychatUtils.apiKeyOf(' k ')).toBe('k');
    expect(manychatUtils.apiKeyOf({ secret_text: ' k ' })).toBe('k');
    expect(manychatUtils.apiKeyOf({})).toBe('');
    expect(manychatUtils.apiKeyOf(undefined)).toBe('');
  });

  test('encodes query values and drops empty ones', () => {
    const url = new URL(manychatUtils.buildUrl({ path: '/subscriber/findBySystemField', query: { email: 'a+b@x.com', phone: '', other: undefined } }));
    expect(url.searchParams.get('email')).toBe('a+b@x.com');
    expect(url.search).toContain('a%2Bb%40x.com');
    expect(url.searchParams.has('phone')).toBe(false);
  });

  test('refuses paths outside the ManyChat API', () => {
    expect(() => manychatUtils.buildUrl({ path: '//evil.io/x' })).toThrow('unexpected path');
    expect(() => manychatUtils.buildUrl({ path: '/page/../x' })).toThrow('unexpected path');
    expect(() => manychatUtils.buildUrl({ path: '/page/getInfo?x=1' })).toThrow('unexpected path');
  });

  test('a 400 error carries status, code, message and details but never the request body', async () => {
    stubManychat({
      replies: [{ status: 400, body: { status: 'error', message: 'Validation error', code: 3011, details: { messages: [{ message: 'Subscriber does not exist' }] } } }],
    });
    const error = await manychatClient
      .request({ apiKey: API_KEY, method: 'POST', path: '/subscriber/updateSubscriber', operation: 'update subscriber', body: { email: 'secret-pii@example.com' } })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ManychatApiError);
    expect(Reflect.get(Object(error), 'status')).toBe(400);
    expect(Reflect.get(Object(error), 'code')).toBe('3011');
    expect(errorMessage({ error })).toContain('Validation error');
    expect(errorMessage({ error })).toContain('Subscriber does not exist');
    expect(errorMessage({ error })).toContain('24-hour');
    expect(errorMessage({ error })).not.toContain('secret-pii');
    expect(Reflect.has(Object(error), 'body')).toBe(false);
    const logged = vi.mocked(console.error).mock.calls.map((call) => call.map((part) => (part instanceof Error ? part.message : String(part))).join(' ')).join('\n');
    expect(logged).not.toContain('secret-pii');
  });

  test('a 2xx with status error fails', async () => {
    stubManychat({ replies: [{ body: { status: 'error', message: 'Tag not found' } }] });
    await expect(manychatClient.request({ apiKey: API_KEY, method: 'POST', path: '/subscriber/addTag', operation: 'add tag', body: {} })).rejects.toThrow(
      'Tag not found',
    );
  });

  test('401 says reconnect', async () => {
    stubManychat({ replies: [{ status: 401, body: { status: 'error', message: 'Wrong token' } }] });
    await expect(manychatClient.request({ apiKey: API_KEY, method: 'GET', path: '/page/getInfo', operation: 'x' })).rejects.toThrow('reconnect');
  });

  test('429 on GET retries once after a short wait, then fails with the rate-limit hint', async () => {
    const seen = stubManychat({ replies: [{ status: 429, body: { status: 'error', message: 'Too many requests' } }] });
    const waits: number[] = [];
    const error = await manychatClient
      .request({ apiKey: API_KEY, method: 'GET', path: '/page/getTags', operation: 'x', wait: async (ms) => { waits.push(ms); } })
      .catch((e: unknown) => e);
    expect(seen).toHaveLength(2);
    expect(waits).toEqual([2_000]);
    expect(errorMessage({ error })).toContain('rate limit');
  });

  test('429 on GET succeeds when the retry succeeds', async () => {
    const seen = stubManychat({ replies: [{ status: 429 }, ok({ data: [] })] });
    await manychatClient.request({ apiKey: API_KEY, method: 'GET', path: '/page/getTags', operation: 'x', wait: async () => undefined });
    expect(seen).toHaveLength(2);
  });

  test('never retries a POST', async () => {
    const seen = stubManychat({ replies: [{ status: 429 }] });
    await expect(
      manychatClient.request({ apiKey: API_KEY, method: 'POST', path: '/sending/sendFlow', operation: 'send flow', body: {}, wait: async () => undefined }),
    ).rejects.toThrow('HTTP 429');
    expect(seen).toHaveLength(1);
  });

  test('a redirect is not followed', async () => {
    stubManychat({ replies: [{ status: 302 }] });
    await expect(manychatClient.request({ apiKey: API_KEY, method: 'GET', path: '/page/getInfo', operation: 'x' })).rejects.toThrow('HTTP 302');
  });

  test('an empty key is refused before any request', async () => {
    const seen = stubManychat({ replies: [ok()] });
    await expect(manychatClient.request({ apiKey: ' ', method: 'GET', path: '/page/getInfo', operation: 'x' })).rejects.toThrow('empty');
    expect(seen).toHaveLength(0);
  });
});

describe('ManyChat client edge cases (QA)', () => {
  test('403 carries the Pro-plan hint and the vendor text', async () => {
    stubManychat({ replies: [{ status: 403, body: { status: 'error', message: 'Permission denied' } }] });
    const error = await manychatClient.request({ apiKey: API_KEY, method: 'GET', path: '/page/getTags', operation: 'list tags' }).catch((e: unknown) => e);
    expect(errorMessage({ error })).toContain('HTTP 403');
    expect(errorMessage({ error })).toContain('Pro plan');
    expect(errorMessage({ error })).toContain('Permission denied');
  });

  test('a 5xx with a huge non-JSON body says retry later and truncates the vendor text', async () => {
    stubManychat({ replies: [{ status: 502, body: `<html>${'x'.repeat(10_000)}</html>` }] });
    const error = await manychatClient.request({ apiKey: API_KEY, method: 'POST', path: '/sending/sendFlow', operation: 'send flow', body: {} }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ManychatApiError);
    expect(errorMessage({ error })).toContain('HTTP 502');
    expect(errorMessage({ error })).toContain('retry later');
    expect(errorMessage({ error }).length).toBeLessThan(1_000);
  });

  test('a 2xx with an empty body fails instead of returning nothing', async () => {
    stubManychat({ replies: [{ status: 200 }] });
    await expect(manychatClient.request({ apiKey: API_KEY, method: 'GET', path: '/page/getInfo', operation: 'get account info' })).rejects.toThrow('no details returned');
  });

  test('a 2xx with a malformed JSON body fails', async () => {
    stubManychat({ replies: [{ status: 200, body: 'not json at all' }] });
    await expect(manychatClient.request({ apiKey: API_KEY, method: 'GET', path: '/page/getInfo', operation: 'get account info' })).rejects.toThrow('not json at all');
  });

  test('a network failure is rethrown, not turned into an empty result', async () => {
    stubManychat({ replies: [{ networkError: true }] });
    await expect(manychatClient.request({ apiKey: API_KEY, method: 'GET', path: '/page/getTags', operation: 'list tags', wait: async () => undefined })).rejects.toThrow(
      'fetch failed',
    );
  });

  test('a timed-out POST names the operation and warns it may already have been applied', async () => {
    stubManychat({ replies: [ok()] });
    vi.stubGlobal('fetch', async () => {
      throw new DOMException('This operation was aborted', 'AbortError');
    });
    const error = await manychatClient
      .request({ apiKey: API_KEY, method: 'POST', path: '/sending/sendFlow', operation: 'send flow', body: { subscriber_id: 1 } })
      .catch((e: unknown) => e);
    expect(error).not.toBeInstanceOf(ManychatApiError);
    expect(errorMessage({ error })).toBe('ManyChat send flow did not respond within 60 seconds. It may still have been applied; check ManyChat before retrying.');
  });

  test('a timed-out GET does not claim it may have been applied', async () => {
    stubManychat({ replies: [ok()] });
    vi.stubGlobal('fetch', async () => {
      throw new DOMException('This operation was aborted', 'AbortError');
    });
    const error = await manychatClient.request({ apiKey: API_KEY, method: 'GET', path: '/page/getTags', operation: 'list tags' }).catch((e: unknown) => e);
    expect(errorMessage({ error })).toBe('ManyChat list tags did not respond within 60 seconds.');
  });

  test('a network failure names the operation and keeps the cause', async () => {
    stubManychat({ replies: [{ networkError: true }] });
    const error = await manychatClient
      .request({ apiKey: API_KEY, method: 'POST', path: '/page/createTag', operation: 'create tag', body: { name: 'x' } })
      .catch((e: unknown) => e);
    expect(errorMessage({ error })).toBe('Could not reach ManyChat for create tag: fetch failed.');
  });
});
