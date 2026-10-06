import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FathomApiError, fathomClient } from '../src/lib/common/client';
import { apiKeyAuth, installFetch, jsonResponse, oauthAuth, requestOf } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;

beforeEach(() => {
  fetchMock = installFetch();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('fathomClient.request', () => {
  it('sends a bearer token for OAuth and repeats array filters as key[]', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { items: [], next_cursor: null, limit: 10 } }));
    await fathomClient.listPage({ auth: oauthAuth(), path: 'meetings', query: { teams: ['Sales', 'Eng'], include_summary: undefined, cursor: 'c1' } });
    const req = requestOf({ fetchMock, call: 0 });
    expect(req.url).toBe('https://api.fathom.ai/external/v1/meetings?teams%5B%5D=Sales&teams%5B%5D=Eng&cursor=c1');
    expect(req.method).toBe('GET');
    expect(req.headers['authorization']).toBe('Bearer tok_test');
    expect(req.headers['x-api-key']).toBeUndefined();
  });

  it('sends a trimmed X-Api-Key for API key connections', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { items: [] } }));
    await fathomClient.listPage({ auth: apiKeyAuth(), path: 'teams' });
    const req = requestOf({ fetchMock, call: 0 });
    expect(req.headers['x-api-key']).toBe('key_test');
    expect(req.headers['authorization']).toBeUndefined();
  });

  it.each(['/meetings', 'https://evil.io/x', '../oauth2/token', 'meetings?x=1', 'a\\b'])('refuses unexpected path %s', async (path) => {
    await expect(fathomClient.request({ auth: oauthAuth(), method: HttpMethod.GET, path })).rejects.toThrow('unexpected Fathom path');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('turns a 401 into a reconnect message with responseBody and no body field', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 401, body: { error: 'Unauthorized.' } }));
    const error = await fathomClient.request({ auth: oauthAuth(), method: HttpMethod.GET, path: 'teams' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(FathomApiError);
    expect(error).toMatchObject({ status: 401, responseBody: { error: 'Unauthorized.' } });
    expect(error).not.toHaveProperty('body');
    expect(String(error)).toContain('Fathom did not accept the connection (401): Unauthorized. Reconnect');
  });

  it('turns a 400 into a check-your-values message', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 400, body: { error: 'OAuth users are not allowed to include summary.' } }));
    await expect(fathomClient.request({ auth: oauthAuth(), method: HttpMethod.GET, path: 'meetings' })).rejects.toThrow(
      'Fathom rejected the request (400): OAuth users are not allowed to include summary. Check the values'
    );
  });

  it('retries a 429 twice with waits, then throws a rate limit error', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(async () => jsonResponse({ status: 429, body: { error: 'Too many requests' } }));
    const pending = fathomClient.request({ auth: oauthAuth(), method: HttpMethod.GET, path: 'teams' }).catch((e: unknown) => e);
    await vi.advanceTimersByTimeAsync(31000);
    const error = await pending;
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(String(error)).toContain('Fathom rate limit reached (429)');
  });

  it('recovers when a 429 is followed by success', async () => {
    vi.useFakeTimers();
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ status: 429, body: {} }))
      .mockResolvedValueOnce(jsonResponse({ body: { items: [{ name: 'Sales' }], next_cursor: null } }));
    const pending = fathomClient.listPage({ auth: oauthAuth(), path: 'teams' });
    await vi.advanceTimersByTimeAsync(10000);
    expect((await pending).items).toEqual([{ name: 'Sales' }]);
  });

  it('sends JSON content type only when there is a body', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 202, body: { download_id: 'dl_1', recording_id: 1, status: 'processing' } }));
    await fathomClient.requestObject({ auth: oauthAuth(), method: HttpMethod.POST, path: 'recordings/1/download', body: {} });
    const req = requestOf({ fetchMock, call: 0 });
    expect(req.method).toBe('POST');
    expect(req.headers['content-type']).toBe('application/json');
    expect(req.body).toBe('{}');
  });
});

describe('fathomClient.listPages', () => {
  it('follows next_cursor until it is empty', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ body: { items: [{ n: 1 }], next_cursor: 'c2' } }))
      .mockResolvedValueOnce(jsonResponse({ body: { items: [{ n: 2 }], next_cursor: '' } }));
    const result = await fathomClient.listPages({ auth: oauthAuth(), path: 'meeting_types', maxPages: 5 });
    expect(result).toMatchObject({ items: [{ n: 1 }, { n: 2 }], truncated: false, pages: 2 });
    expect(requestOf({ fetchMock, call: 1 }).url).toBe('https://api.fathom.ai/external/v1/meeting_types?cursor=c2');
  });

  it('stops at the page cap and reports truncated', async () => {
    fetchMock.mockImplementation(async () => jsonResponse({ body: { items: [{ n: 1 }], next_cursor: 'more' } }));
    const result = await fathomClient.listPages({ auth: oauthAuth(), path: 'meetings', maxPages: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.truncated).toBe(true);
  });
});
