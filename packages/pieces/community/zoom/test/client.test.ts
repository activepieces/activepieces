import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod } from '@activepieces/pieces-common';
import { ZoomApiError, zoomClient } from '../src/lib/common/client';
import { installFetch, jsonResponse, requestOf } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('zoomClient.request', () => {
  it('sends a bearer token, JSON headers and a timeout signal to the Zoom API', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { id: 'u1' } }));
    const result = await zoomClient.requestObject({ accessToken: 'abc', method: HttpMethod.GET, path: '/users/me', query: { a: 1, b: undefined } });
    const request = requestOf({ fetchMock, call: 0 });
    expect(result).toEqual({ id: 'u1' });
    expect(request.url).toBe('https://api.zoom.us/v2/users/me?a=1');
    expect(request.headers['authorization']).toBe('Bearer abc');
    expect(request.hasSignal).toBe(true);
  });

  it('maps Zoom code 4711 to a missing-scope message naming the scope', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 400, body: { code: 4711, message: 'Invalid access token, does not contain scopes:[cloud_recording:read:list_user_recordings].' } }));
    const error = await zoomClient.request({ accessToken: 'abc', method: HttpMethod.GET, path: '/users/me/recordings' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ZoomApiError);
    expect(String(error)).toContain('missing the scope cloud_recording:read:list_user_recordings');
    expect(String(error)).toContain('reconnect');
  });

  it('falls back to the action scope hint when Zoom does not name the scope', () => {
    const message = zoomClient.errorMessage({ status: 401, responseBody: { code: 4711, message: 'Invalid access token' }, scope: 'user:read:user' });
    expect(message).toContain('missing the scope user:read:user');
  });

  it('throws on non-2xx with a truncated vendor message and no body field', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 404, body: { code: 3001, message: 'x'.repeat(2000) } }));
    const error = await zoomClient.request({ accessToken: 'abc', method: HttpMethod.GET, path: '/meetings/1' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ZoomApiError);
    if (!(error instanceof ZoomApiError)) {
      throw new Error('expected ZoomApiError');
    }
    expect(error.status).toBe(404);
    expect(error.code).toBe(3001);
    expect(error.message.length).toBeLessThan(700);
    expect(Object.keys(error)).not.toContain('body');
  });

  it('names 401 and 429 failures', () => {
    expect(zoomClient.errorMessage({ status: 401, responseBody: { code: 124, message: 'Invalid access token.' } })).toContain('Reconnect');
    expect(zoomClient.errorMessage({ status: 429, responseBody: { message: 'Too many requests' } })).toContain('rate limit');
  });

  it('reports a timeout clearly instead of a raw abort error', async () => {
    const fetchMock = installFetch();
    fetchMock.mockRejectedValueOnce(new DOMException('This operation was aborted', 'AbortError'));
    const error = await zoomClient.request({ accessToken: 'abc', method: HttpMethod.GET, path: '/users/me' }).catch((e: unknown) => e);
    expect(String(error)).toContain('did not answer within 30 seconds');
    expect(String(error)).toContain('GET /users/me');
  });

  it('reports a timeout clearly when the abort error is wrapped as a cause', async () => {
    const fetchMock = installFetch();
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed', { cause: new DOMException('The operation timed out', 'TimeoutError') }));
    const error = await zoomClient.request({ accessToken: 'abc', method: HttpMethod.POST, path: '/users/me/meetings', body: { topic: 'x' } }).catch((e: unknown) => e);
    expect(String(error)).toContain('Zoom did not answer within 30 seconds (POST /users/me/meetings)');
    expect(error).not.toBeInstanceOf(ZoomApiError);
  });

  it('keeps HTTP failures as Zoom API errors, not timeouts', async () => {
    const fetchMock = installFetch();
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 504, body: { message: 'Gateway timeout' } }));
    const error = await zoomClient.request({ accessToken: 'abc', method: HttpMethod.GET, path: '/users/me' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ZoomApiError);
    expect(String(error)).toContain('HTTP 504');
    expect(String(error)).not.toContain('did not answer');
  });

  it('rethrows other network errors unchanged', async () => {
    const fetchMock = installFetch();
    fetchMock.mockRejectedValueOnce(new TypeError('fetch failed'));
    await expect(zoomClient.request({ accessToken: 'abc', method: HttpMethod.GET, path: '/users/me' })).rejects.toThrow('fetch failed');
  });

  it('refuses unexpected paths', async () => {
    await expect(zoomClient.request({ accessToken: 'abc', method: HttpMethod.GET, path: '//evil.io/x' })).rejects.toThrow('unexpected Zoom path');
    await expect(zoomClient.request({ accessToken: 'abc', method: HttpMethod.GET, path: '/meetings/../users' })).rejects.toThrow('unexpected Zoom path');
  });
});

describe('meeting identifiers', () => {
  it('normalizes meeting IDs with spaces and rejects text', () => {
    expect(zoomClient.normalizeMeetingId('857 4606 5432')).toBe('85746065432');
    expect(zoomClient.normalizeMeetingId(85746065432)).toBe('85746065432');
    expect(() => zoomClient.normalizeMeetingId('abc')).toThrow('not a Zoom meeting ID');
  });

  it('validates page size', () => {
    expect(zoomClient.pageSizeOf({ value: undefined, fallback: 30 })).toBe(30);
    expect(zoomClient.pageSizeOf({ value: 300, fallback: 30 })).toBe(300);
    expect(() => zoomClient.pageSizeOf({ value: 301, fallback: 30 })).toThrow('1 to 300');
    expect(() => zoomClient.pageSizeOf({ value: 0, fallback: 30 })).toThrow('1 to 300');
  });
});
