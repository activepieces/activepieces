import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { LeexiApiError, leexiApi } from '../src/lib/common/client';

const auth = { username: 'id', password: 'secret' };

describe('leexiApi.buildQueryString', () => {
  it('serialises arrays with [] and skips empty values', () => {
    const qs = leexiApi.buildQueryString({
      owner_uuid: ['a', 'b'],
      participating_user_uuid: [],
      page: 2,
      source: '',
      to: undefined,
    });
    expect(qs).toBe('?owner_uuid%5B%5D=a&owner_uuid%5B%5D=b&page=2');
  });
});

describe('leexiApi.request', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('encodes path segments', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { data: {} } });
    await leexiApi.request({ auth, method: HttpMethod.GET, path: ['calls', 'a/b?c'] });
    expect(spy.mock.calls[0][0].url).toBe('https://public-api.leexi.ai/v1/calls/a%2Fb%3Fc');
  });

  it.each([
    [401, /401/],
    [403, /403.*scope/],
    [404, /404/],
    [429, /429/],
  ])('maps %i with vendor message in responseBody', async (status, pattern) => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status, responseBody: { success: false, message: 'vendor says no' } }),
    );
    const promise = leexiApi.request({ auth, method: HttpMethod.GET, path: ['users'] });
    await expect(promise).rejects.toBeInstanceOf(LeexiApiError);
    await promise.catch((error: LeexiApiError) => {
      expect(error.message).toMatch(pattern);
      expect(error.message).toContain('vendor says no');
      expect(error.status).toBe(status);
      expect(error.responseBody).toEqual({ success: false, message: 'vendor says no' });
    });
  });
});
