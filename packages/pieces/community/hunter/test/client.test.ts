import { afterEach, describe, expect, test, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { HunterApiError, hunterApi } from '../src/lib/common/client';
import { hunterAuth } from '../src/lib/auth';
import { API_KEY, TEST_SERVER, replies, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('hunter client', () => {
  test('sends the key in X-API-KEY, never in the query string, with a verified-TLS dispatcher', async () => {
    const seen = stubFetch(replies([{ body: { data: {} } }]));
    await hunterApi.request({ apiKey: ` ${API_KEY} `, method: HttpMethod.GET, path: '/account', operation: 'account' });
    expect(seen[0].url).toBe('https://api.hunter.io/v2/account');
    expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
    expect(seen[0].query.has('api_key')).toBe(false);
    expect(seen[0].hasDispatcher).toBe(true);
  });

  test('repeats array query params', async () => {
    const seen = stubFetch(replies([{ body: { data: { leads: [] } } }]));
    await hunterApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/leads', operation: 'x', query: { 'sending_status[]': ['sent', '~'], limit: 5, empty: '' } });
    expect(seen[0].query.getAll('sending_status[]')).toEqual(['sent', '~']);
    expect(seen[0].query.get('limit')).toBe('5');
    expect(seen[0].query.has('empty')).toBe(false);
  });

  test('refuses absolute or traversal paths', async () => {
    await expect(hunterApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '//evil.io/x', operation: 'x' })).rejects.toThrow('relative');
    await expect(hunterApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/../x', operation: 'x' })).rejects.toThrow('relative');
  });

  test('keeps the vendor error text and status, without a body field', async () => {
    stubFetch(replies([{ status: 404, body: { errors: [{ id: 'not_found', code: 404, details: 'This lead does not exist.' }] } }]));
    const error = await hunterApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/leads/1', operation: 'get lead' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(HunterApiError);
    expect(Reflect.get(Object(error), 'status')).toBe(404);
    expect(String(Reflect.get(Object(error), 'message'))).toContain('This lead does not exist.');
    expect(Reflect.has(Object(error), 'body')).toBe(false);
  });

  test('retries 403 rate limits twice, then fails', async () => {
    const seen = stubFetch(replies([{ status: 403, body: { errors: [{ id: 'too_many_requests', details: 'rate limit' }] } }]));
    const waits: number[] = [];
    const error = await hunterApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/account', operation: 'x', wait: async (ms) => { waits.push(ms); } }).catch((e: unknown) => e);
    expect(seen).toHaveLength(3);
    expect(waits).toEqual([2_000, 5_000]);
    expect(String(Reflect.get(Object(error), 'message'))).toContain('rate limit');
  });

  test('does not retry 429 (credits used up)', async () => {
    const seen = stubFetch(replies([{ status: 429, body: { errors: [{ id: 'too_many_requests', details: 'usage limit' }] } }]));
    const error = await hunterApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/email-finder', operation: 'find', wait: async () => undefined }).catch((e: unknown) => e);
    expect(seen).toHaveLength(1);
    expect(String(Reflect.get(Object(error), 'message'))).toContain('credits');
  });
});

describe('auth validate', () => {
  test('401 is invalid key', async () => {
    stubFetch(replies([{ status: 401, body: { errors: [{ id: 'authentication_failed', details: 'No user found' }] } }]));
    const result = await hunterAuth.validate?.({ auth: 'bad', server: TEST_SERVER });
    expect(result).toEqual({ valid: false, error: expect.stringContaining('Invalid API key') });
  });

  test('500 is reported as unreachable, not invalid', async () => {
    stubFetch(replies([{ status: 500, body: {} }]));
    const result = await hunterAuth.validate?.({ auth: 'ok', server: TEST_SERVER });
    expect(result).toEqual({ valid: false, error: expect.stringContaining('Could not reach Hunter') });
  });

  test('200 is valid and calls the free account endpoint', async () => {
    const seen = stubFetch(replies([{ body: { data: { plan_name: 'Free' } } }]));
    const result = await hunterAuth.validate?.({ auth: ' ok ', server: TEST_SERVER });
    expect(result).toEqual({ valid: true });
    expect(seen[0].path).toBe('/v2/account');
    expect(seen[0].headers.get('x-api-key')).toBe('ok');
  });
});
