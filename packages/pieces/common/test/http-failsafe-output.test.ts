import { describe, expect, test } from 'vitest';
import { HttpError, toFailsafeOutput } from '../src/lib/http/core/http-error';

describe('transport failure causes', () => {
  test.each([
    [{ code: 'UND_ERR_CONNECT_TIMEOUT', message: 'connect detail', stack: 'secret', other: 'secret' }, 'fetch failed: UND_ERR_CONNECT_TIMEOUT: connect detail'],
    [{ code: 'UND_ERR_CONNECT_TIMEOUT' }, 'fetch failed: UND_ERR_CONNECT_TIMEOUT'],
    [{ message: 'connect detail' }, 'fetch failed: connect detail'],
    [undefined, 'fetch failed'],
    [null, 'fetch failed'],
    [42, 'fetch failed'],
    ['detail', 'fetch failed'],
    [{ code: 42, message: {} }, 'fetch failed'],
  ])('includes only immediate string details for %j', (cause, body) => {
    const error = Object.assign(new Error('fetch failed'), { cause });
    expect(toFailsafeOutput({ error, requestBody: 'request' })).toEqual({
      response: { status: 0, body }, request: { body: 'request' },
    });
  });

  test('does not traverse cycles and preserves other error shapes', () => {
    const error = Object.assign(new Error('fetch failed'), { cause: {} });
    error.cause = error;
    expect(toFailsafeOutput({ error, requestBody: undefined }).response.body).toBe('fetch failed: fetch failed');
    expect(toFailsafeOutput({ error: 'thrown', requestBody: undefined }).response.body).toBe('thrown');
    const httpError = new HttpError('request', { status: 403, responseBody: 'denied' });
    expect(toFailsafeOutput({ error: httpError, requestBody: 'ignored' })).toEqual(httpError.errorMessage());
  });
});
