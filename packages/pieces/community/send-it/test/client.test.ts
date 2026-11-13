import { afterEach, describe, expect, test, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { SendItApiError, sendItApi } from '../src/lib/common/client';
import { sendItAuth } from '../src/lib/common/auth';
import { API_KEY, TEST_SERVER, replies, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('sendit client', () => {
  test('sends the trimmed bearer key to the fixed v1 base with a verified-TLS dispatcher', async () => {
    const seen = stubFetch(replies([{ body: { success: true } }]));
    await sendItApi.request({ apiKey: ` ${API_KEY} `, method: HttpMethod.GET, path: '/accounts', operation: 'list' });
    expect(seen[0].url).toBe('https://sendit.infiniteappsai.com/api/v1/accounts');
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${API_KEY}`);
    expect(seen[0].hasDispatcher).toBe(true);
  });

  test('refuses absolute or traversal paths', async () => {
    await expect(sendItApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '//evil.io/x', operation: 'x' })).rejects.toThrow('relative');
    await expect(sendItApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/../x', operation: 'x' })).rejects.toThrow('relative');
  });

  test('keeps the vendor error text and status, without a body field', async () => {
    stubFetch(replies([{ status: 404, body: { success: false, error: 'Scheduled post not found: sched_x' } }]));
    const error = await sendItApi.request({ apiKey: API_KEY, method: HttpMethod.DELETE, path: '/scheduled/sched_x', operation: 'cancel' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SendItApiError);
    expect(Reflect.get(Object(error), 'status')).toBe(404);
    expect(String(Reflect.get(Object(error), 'message'))).toContain('Scheduled post not found: sched_x');
    expect(Reflect.has(Object(error), 'body')).toBe(false);
  });

  test('reads errors[] arrays and nested error.message', async () => {
    stubFetch(replies([{ status: 400, body: { success: false, errors: ['first problem'] } }]));
    await expect(sendItApi.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/x', operation: 'x' })).rejects.toThrow('first problem');
  });

  test('retries 429 twice (10 s, 20 s) then fails', async () => {
    const seen = stubFetch(replies([{ status: 429, body: { error: 'slow down' } }]));
    const waits: number[] = [];
    const error = await sendItApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/accounts', operation: 'list', wait: async (ms) => { waits.push(ms); } }).catch((e: unknown) => e);
    expect(seen).toHaveLength(3);
    expect(waits).toEqual([10_000, 20_000]);
    expect(error).toBeInstanceOf(SendItApiError);
  });

});

describe('auth validate', () => {
  test('401 is invalid key', async () => {
    stubFetch(replies([{ status: 401, body: { error: 'Unauthorized' } }]));
    const result = await sendItAuth.validate?.({ auth: 'sk_live_bad', server: TEST_SERVER });
    expect(result).toEqual({ valid: false, error: expect.stringContaining('Invalid API key') });
  });

  test('500 is reported as unreachable, not invalid', async () => {
    stubFetch(replies([{ status: 500, body: { error: 'boom' } }]));
    const result = await sendItAuth.validate?.({ auth: 'sk_live_ok', server: TEST_SERVER });
    expect(result).toEqual({ valid: false, error: expect.stringContaining('Could not reach SendIt') });
  });

  test('200 is valid', async () => {
    const seen = stubFetch(replies([{ body: { success: true, accounts: [] } }]));
    const result = await sendItAuth.validate?.({ auth: ' sk_live_ok ', server: TEST_SERVER });
    expect(result).toEqual({ valid: true });
    expect(seen[0].headers.get('authorization')).toBe('Bearer sk_live_ok');
  });
});
