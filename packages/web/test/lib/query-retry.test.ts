import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, it } from 'vitest';

import { queryRetry } from '@/lib/query-retry';

function httpError(status: number): AxiosError {
  const headers = new AxiosHeaders();
  return new AxiosError('failed', String(status), { headers }, null, {
    status,
    statusText: '',
    headers: {},
    config: { headers },
    data: {},
  });
}

function networkError(): AxiosError {
  return new AxiosError('Network Error', AxiosError.ERR_NETWORK);
}

describe('queryRetry.shouldRetry', () => {
  it.each([400, 401, 402, 403, 404, 409, 422, 429])(
    'never retries a %i response',
    (status) => {
      expect(queryRetry.shouldRetry(0, httpError(status))).toBe(false);
    },
  );

  it.each([500, 502, 503, 504, 408])(
    'retries a %i response until the limit',
    (status) => {
      expect(queryRetry.shouldRetry(0, httpError(status))).toBe(true);
      expect(queryRetry.shouldRetry(1, httpError(status))).toBe(true);
      expect(
        queryRetry.shouldRetry(queryRetry.maxRetries, httpError(status)),
      ).toBe(false);
    },
  );

  it('retries network errors until the limit', () => {
    expect(queryRetry.shouldRetry(0, networkError())).toBe(true);
    expect(queryRetry.shouldRetry(queryRetry.maxRetries, networkError())).toBe(
      false,
    );
  });

  it('retries unknown errors until the limit', () => {
    expect(queryRetry.shouldRetry(0, new Error('boom'))).toBe(true);
    expect(queryRetry.shouldRetry(2, new Error('boom'))).toBe(false);
  });
});

describe('queryRetry.delay', () => {
  it('keeps every delay short', () => {
    expect(queryRetry.delay(0)).toBe(400);
    expect(queryRetry.delay(1)).toBe(800);
    expect(queryRetry.delay(5)).toBe(1500);
  });
});
