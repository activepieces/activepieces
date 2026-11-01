import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { nuelinkApiKeyAuth, nuelinkAuth } from '../src/lib/auth';
import { NuelinkApiError, nuelinkClient } from '../src/lib/common/client';
import { installFetch, jsonResponse, requestOf } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;

beforeEach(() => {
  fetchMock = installFetch();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('error parser handles all four Nuelink error shapes', () => {
  it('Laravel 422 with array messages', () => {
    const message = nuelinkClient.describeError({
      status: 422,
      responseBody: { message: 'The given data was invalid.', errors: { per_page: ['The per page must not be greater than 100.'] } },
    });
    expect(message).toBe('Nuelink rejected the values (422): per_page: The per page must not be greater than 100.');
  });

  it('domain error with string messages', () => {
    const message = nuelinkClient.describeError({
      status: 422,
      responseBody: { status: 'error', message: 'Scheduled post date must be at least 10 minutes in the future', errors: { scheduledAt: 'Scheduled post date must be at least 10 minutes in the future' } },
    });
    expect(message).toContain('scheduledAt: Scheduled post date must be at least 10 minutes in the future');
  });

  it('resource 429 with rate_limit field', () => {
    const message = nuelinkClient.describeError({ status: 429, responseBody: { message: 'Too many requests. Please try again later.', errors: { rate_limit: 'Too many requests. Please try again later' } } });
    expect(message).toContain('Nuelink rate limit reached (429): rate_limit: Too many requests');
    expect(message).toContain('30 requests a minute');
  });

  it('route 429 with message only', () => {
    expect(nuelinkClient.describeError({ status: 429, responseBody: { message: 'Too Many Attempts.' } })).toContain('(429): Too Many Attempts. Nuelink allows');
  });

  it('missing or odd bodies do not crash', () => {
    expect(nuelinkClient.describeError({ status: 500, responseBody: undefined })).toBe('Nuelink had a server error (HTTP 500): no details returned. Try again later.');
    expect(nuelinkClient.describeError({ status: 502, responseBody: '<html>Bad gateway</html>' })).toContain('<html>Bad gateway</html>');
    expect(nuelinkClient.describeError({ status: 400, responseBody: { errors: { media: 42 } } })).toContain('{"errors":{"media":42}}');
  });

  it('401 explains key expiry and 403 names the sensitive-actions setting', () => {
    expect(nuelinkClient.describeError({ status: 401, responseBody: { status: 'error', message: 'Token has expired', errors: { authorization: 'Token has expired' } } })).toContain(
      'expire after 30 days to 1 year'
    );
    expect(
      nuelinkClient.describeError({
        status: 403,
        responseBody: { status: 'error', message: 'Deleting posts through the API is disabled.', errors: { permissions: 'Deleting posts through the API is disabled.' } },
      })
    ).toContain('Allow AI to perform sensitive actions');
  });

  it('thrown error keeps status and responseBody but never a body field', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 404, body: { status: 'error', message: 'Brand not found', errors: { brand_id: 'Brand not found' } } }));
    const error = await nuelinkClient.request({ apiKey: 'k', method: HttpMethod.GET, path: ['brands', '42', 'channels'] }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NuelinkApiError);
    expect(error).toMatchObject({ status: 404, responseBody: { message: 'Brand not found' } });
    expect(error).not.toHaveProperty('body');
    expect(error).toHaveProperty('message', expect.stringContaining('Nuelink could not find it (404): brand_id: Brand not found'));
  });
});

describe('request safety', () => {
  it('sends the bearer key to the fixed host with a TLS-verifying dispatcher and no redirects', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { status: 'success', data: { id: 1 } } }));
    await nuelinkClient.request({ apiKey: 'abc', method: HttpMethod.GET, path: ['brands'] });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.url).toBe('https://app.nuelink.com/api/public/v1/brands');
    expect(request.headers['authorization']).toBe('Bearer abc');
    expect(request.headers['accept']).toBe('application/json');
    expect(request.redirect).toBe('manual');
    expect(request.dispatcher).toBeDefined();
    expect(request.dispatcher?.constructor?.name).toBe('Agent');
  });

  it('refuses a redirect instead of following it', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://evil.example.com' } }));
    await expect(nuelinkClient.request({ apiKey: 'abc', method: HttpMethod.GET, path: ['brands'] })).rejects.toThrow('unexpected redirect (HTTP 302)');
  });

  it('rejects path segments that are not digits or fixed words', async () => {
    await expect(nuelinkClient.request({ apiKey: 'abc', method: HttpMethod.GET, path: ['brands', '../auth'] })).rejects.toThrow('unexpected Nuelink path');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(['42/../x', '42?x=1', ' ', '0', '-1', 'abc', '4.2', '1e5', '//evil.com'])('numericId rejects %j', (value) => {
    expect(() => nuelinkClient.numericId({ value, label: 'Brand' })).toThrow('Brand must be a numeric Nuelink ID');
  });

  it('numericId accepts numbers and padded digit strings', () => {
    expect(nuelinkClient.numericId({ value: 42, label: 'Brand' })).toBe('42');
    expect(nuelinkClient.numericId({ value: ' 8801 ', label: 'Post' })).toBe('8801');
  });

  it('treats a 200 body with status error as a failure', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { status: 'error', message: 'nope', errors: { post: 'nope' } } }));
    await expect(nuelinkClient.request({ apiKey: 'abc', method: HttpMethod.GET, path: ['brands'] })).rejects.toThrow('post: nope');
  });

  it('reports a timeout with the caller hint and does not retry', async () => {
    fetchMock.mockImplementation(async () => {
      throw new DOMException('aborted', 'AbortError');
    });
    await expect(
      nuelinkClient.request({ apiKey: 'abc', method: HttpMethod.POST, path: ['brands'], body: {}, timeoutMs: 120000, timeoutHint: 'Check first.' })
    ).rejects.toThrow('Nuelink did not answer within 120 seconds. Check first.');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe('paging', () => {
  it('walks pages by number and never follows nextPageUrl', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ body: { status: 'success', data: [{ id: 1 }], pagination: { currentPage: 1, perPage: 100, total: 2, lastPage: 2, nextPageUrl: 'https://evil.example.com/p2', prevPageUrl: null } } }))
      .mockResolvedValueOnce(jsonResponse({ body: { status: 'success', data: [], pagination: { currentPage: 2, perPage: 100, total: 2, lastPage: 3, nextPageUrl: 'https://evil.example.com/p3', prevPageUrl: null } } }))
      .mockResolvedValueOnce(jsonResponse({ body: { status: 'success', data: [{ id: 3 }], pagination: { currentPage: 3, perPage: 100, total: 2, lastPage: 3, nextPageUrl: null, prevPageUrl: null } } }));
    const result = await nuelinkClient.listAllPages({ apiKey: 'abc', path: ['brands', '42', 'channels'] });
    expect(result).toEqual({ items: [{ id: 1 }, { id: 3 }], truncated: false });
    expect(fetchMock.mock.calls.map((_, call) => requestOf({ fetchMock, call }).url)).toEqual([
      'https://app.nuelink.com/api/public/v1/brands/42/channels?page=1&per_page=100',
      'https://app.nuelink.com/api/public/v1/brands/42/channels?page=2&per_page=100',
      'https://app.nuelink.com/api/public/v1/brands/42/channels?page=3&per_page=100',
    ]);
  });

  it('reports truncation after the page cap', async () => {
    fetchMock.mockImplementation(async (input: string) => {
      const page = Number(new URL(input).searchParams.get('page'));
      return jsonResponse({ body: { status: 'success', data: [{ id: page }], pagination: { currentPage: page, perPage: 100, total: 5000, lastPage: 50 } } });
    });
    const result = await nuelinkClient.listAllPages({ apiKey: 'abc', path: ['brands'], maxPages: 3 });
    expect(result.truncated).toBe(true);
    expect(result.items).toHaveLength(3);
  });
});

describe('auth validation', () => {
  it('API key: valid on 200 from /auth, with trimmed key', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { status: 'success', data: { id: 'x', name: 'A', joinedAt: '2025-06-20T10:15:30.000000Z', timezone: null } } }));
    await expect(nuelinkApiKeyAuth.validate?.({ auth: { apiKey: '  key  ' }, server: { apiUrl: '', publicUrl: '' } })).resolves.toEqual({ valid: true });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.url).toBe('https://app.nuelink.com/api/public/v1/auth');
    expect(request.headers['authorization']).toBe('Bearer key');
  });

  it('API key: invalid only on 401/403', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 401, body: { status: 'error', message: 'Invalid Token', errors: { authorization: 'Invalid Token' } } }));
    const result = await nuelinkApiKeyAuth.validate?.({ auth: { apiKey: 'bad' }, server: { apiUrl: '', publicUrl: '' } });
    expect(result).toMatchObject({ valid: false, error: expect.stringContaining('did not accept this API key') });
  });

  it('API key: an outage is not reported as a bad key', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 503, body: { message: 'down' } }));
    const result = await nuelinkApiKeyAuth.validate?.({ auth: { apiKey: 'key' }, server: { apiUrl: '', publicUrl: '' } });
    expect(result).toEqual({ valid: false, error: 'Could not reach Nuelink to check the API key (HTTP 503). Try again in a minute.' });
  });

  it('legacy token: checks /api/v1/user on the legacy host', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { id: 1 } }));
    await expect(nuelinkAuth.validate?.({ auth: ' tok ', server: { apiUrl: '', publicUrl: '' } })).resolves.toEqual({ valid: true });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.url).toBe('https://nuelink.com/api/v1/user');
    expect(request.headers['authorization']).toBe('Bearer tok');
  });

  it('legacy token: 401 is invalid, network error is "could not reach"', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 401, body: { status: 'error', errors: { token: 'Invalid token' } } }));
    expect(await nuelinkAuth.validate?.({ auth: 'bad', server: { apiUrl: '', publicUrl: '' } })).toMatchObject({ valid: false, error: expect.stringContaining('automation token') });
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    expect(await nuelinkAuth.validate?.({ auth: 'tok', server: { apiUrl: '', publicUrl: '' } })).toEqual({
      valid: false,
      error: 'Could not reach Nuelink to check the automation token. Try again in a minute.',
    });
  });
});
