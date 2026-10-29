import { afterEach, describe, expect, it, vi } from 'vitest';
import { LemonSqueezyApiError, buildQueryString, lsRequest, listAllPages, numericId, pageParams, seg } from '../src/lib/common/client';
import { lemonSqueezyAuth } from '../src/lib/common/auth';
import { storeOptions } from '../src/lib/common/props';
import { installFetch, jsonResponse } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('IDs and query building', () => {
  it('accepts numeric IDs and rejects path tricks', () => {
    expect(seg({ value: '123', label: 'X' })).toBe('123');
    expect(seg({ value: 45, label: 'X' })).toBe('45');
    expect(numericId({ value: ' 7 ', label: 'X' })).toBe('7');
    for (const bad of ['../webhooks', '1/../2', '1?x=1', '0', '-1', 'abc', '', '1.5', '%2e%2e', undefined]) {
      expect(() => seg({ value: bad, label: 'Order' })).toThrow(/Order must be a numeric/);
    }
  });

  it('keeps brackets in keys and encodes values, skipping empties', () => {
    expect(buildQueryString({ 'filter[user_email]': 'a+b@x.com', 'filter[x]': undefined, y: '' })).toBe('?filter[user_email]=a%2Bb%40x.com');
  });

  it('validates page and per page', () => {
    expect(pageParams({ page: 2, perPage: 100 })).toEqual({ 'page[number]': '2', 'page[size]': '100' });
    expect(pageParams({})).toEqual({});
    expect(() => pageParams({ page: 0 })).toThrow(/Page/);
    expect(() => pageParams({ page: -3 })).toThrow(/Page/);
    expect(() => pageParams({ perPage: 101 })).toThrow(/Per Page/);
    expect(() => pageParams({ perPage: 2.5 })).toThrow(/Per Page/);
  });
});

describe('lsRequest', () => {
  it('sends JSON:API headers to the fixed base URL', async () => {
    const { calls } = installFetch({ 'GET /stores': () => jsonResponse({ value: { data: [] } }) });
    await lsRequest({ apiKey: ' key ', method: 'GET', path: '/stores', query: { 'page[size]': '5' } });
    expect(calls[0].url.toString()).toBe('https://api.lemonsqueezy.com/v1/stores?page%5Bsize%5D=5');
    expect(calls[0].headers['authorization']).toBe('Bearer key');
    expect(calls[0].headers['accept']).toBe('application/vnd.api+json');
  });

  it('refuses paths that could leave the API', async () => {
    installFetch({});
    await expect(lsRequest({ apiKey: 'k', method: 'GET', path: '//evil.io/x' })).rejects.toThrow(/Invalid/);
    await expect(lsRequest({ apiKey: 'k', method: 'GET', path: 'stores' })).rejects.toThrow(/Invalid/);
    await expect(lsRequest({ apiKey: 'k', method: 'GET', path: '/a/../b' })).rejects.toThrow(/Invalid/);
  });

  it('maps JSON:API errors to a readable message with status and responseBody', async () => {
    installFetch({ 'GET /orders/9': () => jsonResponse({ value: { errors: [{ detail: 'The order was not found.' }] }, status: 404 }) });
    const error = await lsRequest({ apiKey: 'k', method: 'GET', path: '/orders/9' }).catch((e) => e);
    expect(error).toBeInstanceOf(LemonSqueezyApiError);
    expect(error.status).toBe(404);
    expect(error.message).toContain('The order was not found.');
    expect(error.responseBody).toEqual({ errors: [{ detail: 'The order was not found.' }] });
    expect('body' in error).toBe(false);
  });

  it('retries 429 at most twice, waiting 20 s then 40 s for the one-minute window', async () => {
    vi.useFakeTimers();
    let n = 0;
    installFetch({ 'GET /stores': () => (++n < 3 ? jsonResponse({ value: {}, status: 429 }) : jsonResponse({ value: { data: [] } })) });
    const promise = lsRequest({ apiKey: 'k', method: 'GET', path: '/stores' });
    await vi.advanceTimersByTimeAsync(19_999);
    expect(n).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(n).toBe(2);
    await vi.advanceTimersByTimeAsync(39_999);
    expect(n).toBe(2);
    await vi.advanceTimersByTimeAsync(1);
    await expect(promise).resolves.toEqual({ status: 200, body: { data: [] } });
    expect(n).toBe(3);
  });

  it('does not retry 429 for connection checks and dropdowns (they must finish well inside 60 s)', async () => {
    vi.useFakeTimers();
    let n = 0;
    installFetch({
      'GET /users/me': () => {
        n++;
        return jsonResponse({ value: {}, status: 429 });
      },
      'GET /stores': () => {
        n++;
        return jsonResponse({ value: {}, status: 429 });
      },
    });
    const started = Date.now();
    const validation = await validate('k');
    expect(validation).toMatchObject({ valid: false, error: expect.stringContaining('rate limit') });
    const dropdown = await storeOptions({ auth: { secret_text: 'k' } });
    expect(dropdown).toMatchObject({ disabled: true, placeholder: expect.stringContaining('rate limit') });
    expect(n).toBe(2);
    expect(Date.now() - started).toBe(0);
  });

  it('fails after the retries are used up', async () => {
    vi.useFakeTimers();
    installFetch({ 'GET /stores': () => jsonResponse({ value: {}, status: 429 }) });
    const promise = lsRequest({ apiKey: 'k', method: 'GET', path: '/stores' }).catch((e) => e);
    await vi.runAllTimersAsync();
    expect((await promise).status).toBe(429);
  });

  it('treats a redirect as an error and handles 204', async () => {
    installFetch({
      'GET /x': () => new Response(null, { status: 302, headers: { location: 'https://evil.io' } }),
      'DELETE /discounts/1': () => jsonResponse({ value: null, status: 204 }),
    });
    await expect(lsRequest({ apiKey: 'k', method: 'GET', path: '/x' })).rejects.toThrow(/redirect/);
    await expect(lsRequest({ apiKey: 'k', method: 'DELETE', path: '/discounts/1' })).resolves.toEqual({ status: 204, body: undefined });
  });
});

describe('listAllPages', () => {
  it('follows pages to the end and flags truncation at the cap', async () => {
    const { calls } = installFetch({
      'GET /stores': (call) => {
        const page = Number(call.url.searchParams.get('page[number]'));
        return jsonResponse({ value: { meta: { page: { currentPage: page, lastPage: 12 } }, data: [{ id: String(page), type: 'stores' }] } });
      },
    });
    const result = await listAllPages({ apiKey: 'k', path: '/stores' });
    expect(result.items).toHaveLength(10);
    expect(result.truncated).toBe(true);
    expect(calls).toHaveLength(10);
  });
});

function validate(auth: string) {
  return lemonSqueezyAuth.validate?.({ auth, server: { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', mintOidcToken: async () => '' } });
}
