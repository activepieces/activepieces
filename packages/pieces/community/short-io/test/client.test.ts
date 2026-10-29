import { afterEach, describe, expect, test, vi } from 'vitest';
import { shortIoAuth } from '../src/lib/common/auth';
import { shortIoClient, ShortIoApiError } from '../src/lib/common/client';
import { API_KEY, replies, stubFetch } from './helpers';
import { HttpMethod } from '@activepieces/pieces-common';

const auth = { props: { apiKey: `  ${API_KEY} ` } };

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('client', () => {
  test('seg encodes and rejects dot segments', () => {
    expect(shortIoClient.seg({ value: '../domains/settings/1', label: 'Link ID' })).toBe('..%2Fdomains%2Fsettings%2F1');
    expect(() => shortIoClient.seg({ value: '..', label: 'Link ID' })).toThrow('Link ID is required');
    expect(() => shortIoClient.seg({ value: '  ', label: 'Link ID' })).toThrow();
    expect(() => shortIoClient.domainIdSeg('12/../3')).toThrow('Domain ID must be a number');
    expect(shortIoClient.domainIdSeg(42)).toBe('42');
  });
  test('sends the raw trimmed key and parses the vendor error field into responseBody', async () => {
    const seen = stubFetch(replies([{ status: 404, body: { error: 'Domain not found' } }]));
    const error = await shortIoClient.request({ auth, method: HttpMethod.GET, path: '/links/x' }).catch((e: unknown) => e);
    expect(seen[0].headers.get('authorization')).toBe(API_KEY);
    expect(seen[0].url.origin).toBe('https://api.short.io');
    expect(error).toBeInstanceOf(ShortIoApiError);
    expect(error).toMatchObject({ status: 404, responseBody: { error: 'Domain not found' } });
    expect(error).not.toHaveProperty('body');
    expect(String(error)).toContain('Domain not found');
  });
  test('status mapping uses the status, not text in the message', async () => {
    stubFetch(replies([{ status: 500, body: { message: 'path 404-page broke' } }]));
    const error = await shortIoClient.request({ auth, method: HttpMethod.GET, path: '/x' }).catch((e: unknown) => e);
    expect(() => shortIoClient.rethrowWithHint({ error, hints: { 404: 'not found hint' } })).toThrow('path 404-page broke');
    expect(() => shortIoClient.rethrowWithHint({ error, hints: { 404: 'not found hint' } })).not.toThrow('not found hint');
  });
  test('retries 429 at most twice', async () => {
    vi.useFakeTimers();
    const seen = stubFetch(replies([{ status: 429, headers: { 'retry-after': '1' } }, { status: 429 }, { status: 429, body: { error: 'slow down' } }]));
    const promise = shortIoClient.request({ auth, method: HttpMethod.GET, path: '/x' }).catch((e: unknown) => e);
    await vi.runAllTimersAsync();
    expect(await promise).toMatchObject({ status: 429 });
    expect(seen).toHaveLength(3);
  });
  test('stats requests go to statistics.short.io', async () => {
    const seen = stubFetch(replies([{ body: {} }]));
    await shortIoClient.request({ auth, method: HttpMethod.GET, base: 'stats', path: '/domain/1', query: { period: 'last7', tz: undefined } });
    expect(seen[0].url.toString()).toBe('https://statistics.short.io/statistics/domain/1?period=last7');
  });
});

describe('auth.validate', () => {
  test('401 is invalid key, 500 is a reachability error', async () => {
    stubFetch(replies([{ status: 401, body: { error: 'Unauthorized' } }]));
    expect(await shortIoAuth.validate?.({ auth: { apiKey: 'bad' }, server: { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' } })).toMatchObject({ valid: false, error: expect.stringContaining('Invalid API Key') });
    stubFetch(replies([{ status: 500, body: { error: 'Upstream service error' } }]));
    const result = await shortIoAuth.validate?.({ auth: { apiKey: 'k' }, server: { apiUrl: '', publicUrl: '', mintOidcToken: async () => '' } });
    expect(result).toMatchObject({ valid: false });
    expect(JSON.stringify(result)).toContain('Upstream service error');
  });
});

describe('secret bodies', () => {
  test('a request carrying a link password is never logged on failure', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubFetch(replies([{ status: 400, body: { message: 'bad' } }]));
    await expect(shortIoClient.request({ auth, method: HttpMethod.POST, path: '/links', body: { originalURL: 'https://a.b', password: 'hunter2' } })).rejects.toThrow('bad');
    expect(JSON.stringify(logged.mock.calls)).not.toContain('hunter2');
    logged.mockRestore();
  });
  test('a request without a password goes through httpClient and keeps the redirect off', async () => {
    const seen = stubFetch(replies([{ status: 302, body: {} }]));
    await expect(shortIoClient.request({ auth, method: HttpMethod.GET, path: '/api/domains' })).rejects.toThrow('302');
    expect(seen).toHaveLength(1);
  });
});
