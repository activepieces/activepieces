import { describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { createClient } from '../client';
import { RETRY_AFTER_CAP_SECONDS } from '../constants';

const ok = (body: unknown) => ({ status: 200, body, headers: {} });

describe('createClient', () => {
  it('sends the bearer token and returns the parsed body', async () => {
    const send = vi.fn().mockResolvedValue(ok({ object: 'me' }));
    const client = createClient('key_live_x', { send });

    const result = await client.request<{ object: string }>({ path: '/v1/me' });

    expect(result).toEqual({ object: 'me' });
    const request = send.mock.calls[0][0];
    expect(request.url).toBe('https://api.studio.polotno.com/v1/me');
    expect(request.method).toBe(HttpMethod.GET);
    expect(request.authentication).toEqual({ type: 'BEARER_TOKEN', token: 'key_live_x' });
  });

  it('retries a 429 after backing off', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const send = vi
      .fn()
      .mockRejectedValueOnce(new HttpError({}, { status: 429, responseBody: {} }))
      .mockResolvedValueOnce(ok({ id: 'img_1' }));
    const client = createClient('key_live_x', { send, sleep });

    await expect(client.request({ path: '/v1/images', method: HttpMethod.POST })).resolves.toEqual({ id: 'img_1' });
    expect(send).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('grows the backoff between retries and never exceeds the cap', async () => {
    const delays: number[] = [];
    const sleep = vi.fn().mockImplementation((ms: number) => {
      delays.push(ms);
      return Promise.resolve();
    });
    const send = vi
      .fn()
      .mockRejectedValueOnce(new HttpError({}, { status: 429, responseBody: {} }))
      .mockRejectedValueOnce(new HttpError({}, { status: 429, responseBody: {} }))
      .mockResolvedValueOnce(ok({ id: 'img_1' }));
    const client = createClient('key_live_x', { send, sleep });

    await client.request({ path: '/v1/images', method: HttpMethod.POST });

    expect(delays).toHaveLength(2);
    expect(delays[1]).toBeGreaterThan(delays[0]);
    for (const delay of delays) {
      expect(delay).toBeLessThanOrEqual(RETRY_AFTER_CAP_SECONDS * 1_000);
    }
  });

  it('gives up after the retry budget and throws a friendly error', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const send = vi.fn().mockRejectedValue(
      new HttpError({}, { status: 429, responseBody: { error: { type: 't', code: 'rate_limit_exceeded', message: 'slow down' } } }),
    );
    const client = createClient('key_live_x', { send, sleep });

    await expect(client.request({ path: '/v1/images' })).rejects.toThrow('Rate limit exceeded');
    expect(send).toHaveBeenCalledTimes(4); // 1 initial + 3 retries
  });

  it('does not retry a 400 and surfaces the friendly message', async () => {
    const send = vi.fn().mockRejectedValue(
      new HttpError({}, { status: 401, responseBody: { error: { type: 't', code: 'invalid_api_key', message: 'nope' } } }),
    );
    const client = createClient('key_live_x', { send });

    await expect(client.request({ path: '/v1/me' })).rejects.toThrow('Invalid API key');
    expect(send).toHaveBeenCalledTimes(1);
  });
});
