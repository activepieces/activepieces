import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { NetSuiteClient } from './client';

vi.mock('@activepieces/pieces-common', async () => {
  const actual = await vi.importActual<typeof import('@activepieces/pieces-common')>(
    '@activepieces/pieces-common'
  );
  return {
    ...actual,
    httpClient: { sendRequest: vi.fn() },
  };
});

const auth = {
  accountId: 'acc',
  consumerKey: 'key',
  consumerSecret: 'secret',
  tokenId: 'token',
  tokenSecret: 'tokenSecret',
};

function rateLimitError(): HttpError {
  return new HttpError(undefined, { status: 429, responseBody: 'Too many requests' });
}

describe('NetSuiteClient retry/backoff', () => {
  beforeEach(() => {
    vi.mocked(httpClient.sendRequest).mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries on 429 with a fresh OAuth header each attempt, then succeeds', async () => {
    vi.useFakeTimers();
    const sendRequest = vi.mocked(httpClient.sendRequest);
    sendRequest
      .mockRejectedValueOnce(rateLimitError())
      .mockRejectedValueOnce(rateLimitError())
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { ok: true } });

    const client = new NetSuiteClient(auth);
    const resultPromise = client.makeRequest({
      method: HttpMethod.GET,
      url: `${client.baseUrl}/services/rest/record/v1/vendor/1`,
    });

    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({ ok: true });
    expect(sendRequest).toHaveBeenCalledTimes(3);
    const authHeaders = sendRequest.mock.calls.map(
      ([request]) => (request.headers as Record<string, string>)['Authorization']
    );
    expect(new Set(authHeaders).size).toBe(3);
  });

  it('rethrows once retries are exhausted', async () => {
    vi.useFakeTimers();
    const sendRequest = vi.mocked(httpClient.sendRequest);
    sendRequest.mockRejectedValue(rateLimitError());

    const client = new NetSuiteClient(auth);
    const resultPromise = client
      .makeRequest({
        method: HttpMethod.GET,
        url: `${client.baseUrl}/services/rest/record/v1/vendor/1`,
      })
      .catch((error) => error);

    await vi.runAllTimersAsync();
    const error = await resultPromise;

    expect(error).toBeInstanceOf(HttpError);
    expect(sendRequest).toHaveBeenCalledTimes(6);
  });

  it('does not retry non-429 errors', async () => {
    const sendRequest = vi.mocked(httpClient.sendRequest);
    const notFound = new HttpError(undefined, { status: 404, responseBody: 'Not found' });
    sendRequest.mockRejectedValue(notFound);

    const client = new NetSuiteClient(auth);
    await expect(
      client.makeRequest({
        method: HttpMethod.GET,
        url: `${client.baseUrl}/services/rest/record/v1/vendor/1`,
      })
    ).rejects.toBe(notFound);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });
});
