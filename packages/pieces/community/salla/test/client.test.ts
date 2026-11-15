import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { BASE_URL, SallaApiError, sallaApi } from '../src/lib/common/client';

const auth = { access_token: 'token-123' };

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function httpError({ status, body }: { status: number; body: unknown }) {
  return new HttpError({}, { status, responseBody: body });
}

function recordingSleep() {
  const delays: number[] = [];
  const sleep = async (ms: number) => {
    delays.push(ms);
  };
  return { delays, sleep };
}

function sameSentence(actual: string): string {
  return actual.replace(/\.$/, '');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('sallaApi.request', () => {
  it('builds the URL, bearer header and Accept header, and returns status and body', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ status: 200, success: true, data: { id: 1 } }));
    const response = await sallaApi.request({ auth, method: HttpMethod.GET, path: 'orders/1', query: { format: 'light' } });
    expect(response).toEqual({ status: 200, body: { status: 200, success: true, data: { id: 1 } } });
    const sent = spy.mock.calls[0][0];
    expect(sent.url).toBe(`${BASE_URL}/orders/1?format=light`);
    expect(sent.headers).toEqual({ Authorization: 'Bearer token-123', Accept: 'application/json' });
    expect(sent.method).toBe(HttpMethod.GET);
  });

  it('sends Accept-Language when the connection picks a language, but not for "default"', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: {} }));
    await sallaApi.request({ auth: { access_token: 't', props: { language: ' en ' } }, method: HttpMethod.GET, path: '/x' });
    await sallaApi.request({ auth: { access_token: 't', props: { language: 'default' } }, method: HttpMethod.GET, path: '/x' });
    expect(spy.mock.calls[0][0].headers).toMatchObject({ 'Accept-Language': 'en' });
    expect(spy.mock.calls[1][0].headers).not.toHaveProperty('Accept-Language');
  });

  it('only lets the HTTP client retry GETs, never writes', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: {} }));
    await sallaApi.request({ auth, method: HttpMethod.GET, path: '/x' });
    await sallaApi.request({ auth, method: HttpMethod.POST, path: '/x', body: { a: 1 } });
    expect(spy.mock.calls[0][0].retries).toBeGreaterThan(0);
    expect(spy.mock.calls[1][0].retries).toBe(0);
    expect(spy.mock.calls[1][0].body).toEqual({ a: 1 });
  });

  it('turns a missing body into an empty envelope', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 204, headers: {}, body: undefined });
    const response = await sallaApi.request({ auth, method: HttpMethod.DELETE, path: '/x' });
    expect(response).toEqual({ status: 204, body: {} });
  });

  it('maps an HttpError to SallaApiError with status and body', async () => {
    const body = { status: 404, success: false, error: { code: 'not_found', message: 'Order not found' } };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(httpError({ status: 404, body }));
    const error = await sallaApi.request({ auth, method: HttpMethod.GET, path: '/orders/1' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(SallaApiError);
    expect(sallaApi.isSallaApiError(error)).toBe(true);
    expect(error).toMatchObject({ name: 'SallaApiError', status: 404, responseBody: body });
  });

  it('rethrows non-HTTP errors unchanged', async () => {
    const original = new Error('socket hang up');
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(original);
    await expect(sallaApi.request({ auth, method: HttpMethod.GET, path: '/x' })).rejects.toBe(original);
  });
});

describe('429 handling', () => {
  it('waits and retries on 429, then succeeds', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockRejectedValueOnce(httpError({ status: 429, body: { error: { message: 'Too Many Attempts.' } } }))
      .mockRejectedValueOnce(httpError({ status: 429, body: { error: { message: 'Too Many Attempts.' } } }))
      .mockResolvedValueOnce(ok({ data: { id: 7 } }));
    const { delays, sleep } = recordingSleep();
    const response = await sallaApi.request({ auth, method: HttpMethod.GET, path: '/x', sleep });
    expect(response.body.data).toEqual({ id: 7 });
    expect(spy).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([2000, 4000]);
  });

  it('gives up after the retry cap with a readable rate-limit message', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockRejectedValue(httpError({ status: 429, body: { error: { code: 'too_many_requests', message: 'Too Many Attempts.' } } }));
    const { delays, sleep } = recordingSleep();
    const error = await sallaApi.request({ auth, method: HttpMethod.GET, path: '/x', sleep }).catch((e: unknown) => e);
    expect(spy).toHaveBeenCalledTimes(3);
    expect(delays).toEqual([2000, 4000]);
    expect(error).toBeInstanceOf(SallaApiError);
    expect(sameSentence(error instanceof Error ? error.message : '')).toBe(
      'Salla API error (429): Too Many Attempts. Salla rate limit reached (120 to 720 requests per minute, depending on the store plan). Wait a minute, then retry',
    );
  });

  it('does not retry non-429 errors', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(httpError({ status: 500, body: {} }));
    const { delays, sleep } = recordingSleep();
    await expect(sallaApi.request({ auth, method: HttpMethod.POST, path: '/x', sleep })).rejects.toThrow(
      'Salla API error (500). Salla had an internal error. Retry later',
    );
    expect(spy).toHaveBeenCalledTimes(1);
    expect(delays).toEqual([]);
  });

  it('withRateLimitRetry does not retry plain errors', async () => {
    const send = vi.fn().mockRejectedValue(new Error('boom'));
    const { delays, sleep } = recordingSleep();
    await expect(sallaApi.withRateLimitRetry({ send, sleep })).rejects.toThrow('boom');
    expect(send).toHaveBeenCalledTimes(1);
    expect(delays).toEqual([]);
  });

  it('withRateLimitRetry retries a SallaApiError 429 and returns the result', async () => {
    const send = vi
      .fn()
      .mockRejectedValueOnce(new SallaApiError({ status: 429, responseBody: {} }))
      .mockResolvedValueOnce('done');
    const { delays, sleep } = recordingSleep();
    await expect(sallaApi.withRateLimitRetry({ send, sleep })).resolves.toBe('done');
    expect(delays).toEqual([2000]);
  });

  it('caps the backoff delay and guards bad attempts', () => {
    expect(sallaApi.rateLimitDelayMs(0)).toBe(2000);
    expect(sallaApi.rateLimitDelayMs(1)).toBe(4000);
    expect(sallaApi.rateLimitDelayMs(2)).toBe(8000);
    expect(sallaApi.rateLimitDelayMs(3)).toBe(8000);
    expect(sallaApi.rateLimitDelayMs(50)).toBe(8000);
    expect(sallaApi.rateLimitDelayMs(-1)).toBe(2000);
    expect(sallaApi.rateLimitDelayMs(Number.NaN)).toBe(2000);
    expect(sallaApi.rateLimitDelayMs(Number.POSITIVE_INFINITY)).toBe(2000);
  });
});

describe('buildErrorMessage', () => {
  it('names the missing scope and says to reconnect on a 401 scope error', () => {
    const message = sallaApi.buildErrorMessage({
      status: 401,
      responseBody: {
        status: 401,
        success: false,
        error: { code: 'Unauthorized', message: 'The access token should have access to one of those scopes: orders.read_write' },
      },
    });
    expect(message).toContain('orders.read_write');
    expect(message).toContain('reconnect');
    expect(message).toBe(
      'Salla rejected the request because the token lacks the scope orders.read_write. In the Salla Partners Portal open your app, tick that scope under App Scopes, then reconnect this Salla connection.',
    );
  });

  it('keeps several scopes and drops trailing punctuation', () => {
    const message = sallaApi.buildErrorMessage({
      status: 401,
      responseBody: { error: { message: 'The access token should have access to one of those scopes: products.read, products.read_write.' } },
    });
    expect(message).toContain('lacks the scope products.read, products.read_write. In the Salla');
  });

  it('handles a plain 401', () => {
    expect(
      sallaApi.buildErrorMessage({ status: 401, responseBody: { error: { code: 'Unauthorized', message: 'The access token is invalid' } } }),
    ).toBe(
      'Salla rejected the access token (401: The access token is invalid). Reconnect the Salla connection. If it keeps failing, check that the app still has access to the store.',
    );
    expect(sallaApi.buildErrorMessage({ status: 401, responseBody: '' })).toBe(
      'Salla rejected the access token (401). Reconnect the Salla connection. If it keeps failing, check that the app still has access to the store.',
    );
  });

  it('lists per-field 422 messages and replaces the alert.invalid_fields key', () => {
    const message = sallaApi.buildErrorMessage({
      status: 422,
      responseBody: {
        status: 422,
        success: false,
        error: {
          code: 'error',
          message: 'alert.invalid_fields',
          fields: { first_name: ['حقل الاسم الأول مطلوب.'], mobile: ['The mobile is invalid.', 'The mobile is taken.'], empty: [] },
        },
      },
    });
    expect(message).not.toContain('alert.invalid_fields');
    expect(sameSentence(message)).toBe(
      'Salla API error (422): invalid fields: first_name: حقل الاسم الأول مطلوب; mobile: The mobile is invalid, The mobile is taken. Fix the listed fields and try again',
    );
  });

  it('falls back to a readable phrase when the only message is the alert key', () => {
    expect(sameSentence(sallaApi.buildErrorMessage({ status: 422, responseBody: { error: { code: 'error', message: 'alert.invalid_fields' } } }))).toBe(
      'Salla API error (422): invalid fields. Fix the listed fields and try again',
    );
  });

  it('accepts a string field message', () => {
    expect(sameSentence(sallaApi.buildErrorMessage({ status: 400, responseBody: { error: { fields: { sku: 'Duplicate SKU.' } } } }))).toBe(
      'Salla API error (400): invalid fields: sku: Duplicate SKU. Check the values sent to Salla',
    );
  });

  it('uses a string error at the top level', () => {
    expect(sameSentence(sallaApi.buildErrorMessage({ status: 400, responseBody: { error: 'invalid_request.' } }))).toBe(
      'Salla API error (400): invalid_request. Check the values sent to Salla',
    );
  });

  it('uses a plain string body', () => {
    expect(sallaApi.buildErrorMessage({ status: 502, responseBody: '  Bad Gateway  ' })).toBe('Salla API error (502): Bad Gateway.');
  });

  it('does not double the full stop when a string body already ends with one', () => {
    expect(sameSentence(sallaApi.buildErrorMessage({ status: 500, responseBody: 'Server Error.' }))).toBe(
      'Salla API error (500): Server Error. Salla had an internal error. Retry later',
    );
  });

  it('ends a hinted message with a full stop like the other messages', () => {
    expect(sallaApi.buildErrorMessage({ status: 404, responseBody: '' })).toMatch(/another store\.$/);
  });

  it('cuts very long string bodies', () => {
    const message = sallaApi.buildErrorMessage({ status: 502, responseBody: 'x'.repeat(5000) });
    expect(message.length).toBeLessThan(700);
  });

  it('handles empty and unknown bodies', () => {
    expect(sameSentence(sallaApi.buildErrorMessage({ status: 500, responseBody: '' }))).toBe('Salla API error (500). Salla had an internal error. Retry later');
    expect(sallaApi.buildErrorMessage({ status: 418, responseBody: undefined })).toBe('Salla API error (418).');
    expect(sallaApi.buildErrorMessage({ status: 418, responseBody: {} })).toBe('Salla API error (418).');
    expect(sallaApi.buildErrorMessage({ status: 418, responseBody: [1, 2] })).toBe('Salla API error (418).');
  });

  it('adds the internal-ID hint on an order 404', () => {
    expect(sameSentence(sallaApi.buildErrorMessage({ status: 404, responseBody: { error: { code: 'not_found', message: 'Not Found' } }, path: '/orders/7' }))).toBe(
      'Salla API error (404): Not Found. Check the ID: the record may have been deleted, or the ID belongs to another store. For orders, use the internal order ID (for example 2116149737), not the reference number customers see',
    );
  });

  it('reads a message at the top level when there is no error object', () => {
    expect(sameSentence(sallaApi.buildErrorMessage({ status: 403, responseBody: { message: 'Blocked due to many errors.' } }))).toBe(
      'Salla API error (403): Blocked due to many errors. Salla blocked this request for the connected store. Check that the app is still installed and allowed for this store',
    );
  });
});

describe('buildQueryString and buildUrl', () => {
  it('encodes arrays as key[] and skips empty values', () => {
    const search = sallaApi.buildQueryString({ status: [1, 2], 'branch[]': ['5'], keyword: 'abc', empty: '', none: undefined, nil: null, zero: 0, no: false });
    const params = new URLSearchParams(search);
    expect(params.getAll('status[]')).toEqual(['1', '2']);
    expect(params.getAll('branch[]')).toEqual(['5']);
    expect(params.get('keyword')).toBe('abc');
    expect(params.has('empty')).toBe(false);
    expect(params.has('none')).toBe(false);
    expect(params.has('nil')).toBe(false);
    expect(params.get('zero')).toBe('0');
    expect(params.get('no')).toBe('false');
    expect(params.has('status')).toBe(false);
    expect(search).toContain('status%5B%5D=1&status%5B%5D=2');
  });

  it('returns an empty string for no query and skips empty array entries', () => {
    expect(sallaApi.buildQueryString(undefined)).toBe('');
    expect(sallaApi.buildQueryString({ status: [] })).toBe('');
    expect(sallaApi.buildQueryString({ status: ['', '3'] })).toBe('status%5B%5D=3');
  });

  it('normalises the path and adds the query only when present', () => {
    expect(sallaApi.buildUrl({ path: 'orders' })).toBe('https://api.salla.dev/admin/v2/orders');
    expect(sallaApi.buildUrl({ path: '/orders', query: { page: 2 } })).toBe('https://api.salla.dev/admin/v2/orders?page=2');
    expect(sallaApi.buildUrl({ path: '/orders', query: { keyword: undefined } })).toBe('https://api.salla.dev/admin/v2/orders');
    expect(sallaApi.buildUrl({ path: '/x', query: { keyword: 'محمد & co' } })).toBe(
      `https://api.salla.dev/admin/v2/x?${new URLSearchParams({ keyword: 'محمد & co' }).toString()}`,
    );
  });
});
