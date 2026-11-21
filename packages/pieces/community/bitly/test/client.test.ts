import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { bitlyApiCall, buildQueryString, normalizeBitlinkId } from '../src/lib/common/client';

const AUTH = { accessToken: 'tok' };

afterEach(() => {
  vi.restoreAllMocks();
});

function failWith({ status, body }: { status: number; body: unknown }) {
  vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(new HttpError({}, { status, responseBody: body }));
}

describe('bitlyApiCall error mapping', () => {
  it.each([400, 401, 403, 404, 429])('surfaces the Bitly message once for HTTP %i', async (status) => {
    failWith({ status, body: { message: 'INVALID_ARG_LONG_URL', description: 'The value provided is invalid.' } });
    const error = await bitlyApiCall({ method: HttpMethod.GET, resourceUri: '/x', auth: AUTH, operation: 'get Bitlink' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    const message = error instanceof Error ? error.message : '';
    expect(message.startsWith(`Bitly get Bitlink failed (HTTP ${status}): INVALID_ARG_LONG_URL - The value provided is invalid.`)).toBe(true);
    expect(message.match(/Bitly/g)?.length).toBeLessThanOrEqual(2);
    expect(message).not.toContain('Unknown error');
  });

  it('maps transport errors on POST and warns the request may have been applied', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(new Error('This operation was aborted'));
    await expect(
      bitlyApiCall({ method: HttpMethod.POST, resourceUri: '/bitlinks', auth: AUTH, operation: 'create Bitlink' })
    ).rejects.toThrow('Bitly create Bitlink failed: could not reach Bitly (This operation was aborted). The request may still have been applied');
  });

  it('does not warn about applied requests for GET transport errors', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(new Error('ECONNRESET'));
    const error = await bitlyApiCall({ method: HttpMethod.GET, resourceUri: '/x', auth: AUTH, operation: 'get' }).catch((e: unknown) => e);
    expect(error instanceof Error ? error.message : '').not.toContain('may still have been applied');
  });

  it('sends bearer token, Accept and a timeout', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({ status: 200, headers: {}, body: { ok: true } });
    await bitlyApiCall({ method: HttpMethod.GET, resourceUri: '/user', auth: { accessToken: ' tok ' } });
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe('https://api-ssl.bitly.com/v4/user');
    expect(request.headers).toMatchObject({ Authorization: 'Bearer tok', Accept: 'application/json' });
    expect(request.timeout).toBeGreaterThan(0);
  });
});

describe('buildQueryString', () => {
  it('repeats array keys and drops empty values', () => {
    expect(buildQueryString({ tags: ['a', 'b c'], query: undefined, size: 5, empty: '' })).toBe('?tags=a&tags=b%20c&size=5');
  });
});

describe('normalizeBitlinkId', () => {
  it.each([
    ['bit.ly/abc', 'bit.ly/abc'],
    ['https://bit.ly/abc', 'bit.ly/abc'],
    ['http://bit.ly/abc/', 'bit.ly/abc'],
    [' https://bit.ly/abc?x=1 ', 'bit.ly/abc'],
  ])('normalises %s', (input, expected) => {
    expect(normalizeBitlinkId(input)).toBe(expected);
  });

  it('rejects values without a back-half', () => {
    expect(() => normalizeBitlinkId('abc')).toThrow('is not a Bitlink ID');
  });
});
