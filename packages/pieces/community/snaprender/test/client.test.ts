import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { SnapRenderApiError, snaprenderApi } from '../src/lib/common/client';
import { API_KEY, PNG, apiError, replies, stubFetch } from './helpers';

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('request', () => {
    test('sends the key in X-API-Key to app.snap-render.com and drops empty query values', async () => {
        const seen = stubFetch(replies([{ body: { ok: true } }]));
        const response = await snaprenderApi.request({
            apiKey: ` ${API_KEY} `,
            method: HttpMethod.GET,
            path: '/v1/screenshot/info',
            query: { url: 'https://example.com/a?b=1', format: 'png', width: 1280, height: undefined, empty: '' },
        });
        expect(response.body).toEqual({ ok: true });
        expect(seen[0].origin).toBe('https://app.snap-render.com');
        expect(seen[0].path).toBe('/v1/screenshot/info');
        expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
        expect(seen[0].query.get('url')).toBe('https://example.com/a?b=1');
        expect(seen[0].query.get('width')).toBe('1280');
        expect(seen[0].query.has('height')).toBe(false);
        expect(seen[0].query.has('empty')).toBe(false);
        expect(seen[0].query.has('api_key')).toBe(false);
    });
    test('posts JSON bodies', async () => {
        const seen = stubFetch(replies([{ body: { jobId: 'j1' } }]));
        await snaprenderApi.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/v1/screenshot/batch', body: { urls: ['https://a.com'] } });
        expect(seen[0].method).toBe('POST');
        expect(seen[0].headers.get('content-type')).toContain('application/json');
        expect(seen[0].body).toEqual({ urls: ['https://a.com'] });
    });
    test('returns binary bodies as a Buffer with headers', async () => {
        stubFetch(replies([{ binary: PNG, headers: { 'x-cache': 'MISS', 'x-remaining-credits': '42' } }]));
        const response = await snaprenderApi.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/v1/screenshot', body: { url: 'https://a.com' }, responseType: 'arraybuffer' });
        expect(snaprenderApi.toBuffer(response.body).equals(PNG)).toBe(true);
        expect(snaprenderApi.headerValue({ headers: response.headers, name: 'X-Cache' })).toBe('MISS');
        expect(snaprenderApi.headerValue({ headers: response.headers, name: 'x-remaining-credits' })).toBe('42');
    });
    test('refuses an empty key before any request', async () => {
        const seen = stubFetch(replies([{ body: {} }]));
        await expect(snaprenderApi.request({ apiKey: '  ', method: HttpMethod.GET, path: '/v1/usage' })).rejects.toThrow(/API key is empty/);
        expect(seen).toHaveLength(0);
    });
    test('refuses paths that could leave the SnapRender host', async () => {
        const seen = stubFetch(replies([{ body: {} }]));
        await expect(snaprenderApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '//evil.example/x' })).rejects.toThrow(/Invalid SnapRender path/);
        await expect(snaprenderApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: 'v1/usage' })).rejects.toThrow(/Invalid SnapRender path/);
        expect(seen).toHaveLength(0);
    });
});

describe('errors', () => {
    test.each([
        [422, 'TARGET_UNREACHABLE', 'The target website could not be reached.'],
        [422, 'TARGET_SSL_ERROR', 'The target website has an invalid SSL certificate.'],
        [500, 'RENDER_FAILED', 'The page could not be rendered.'],
        [408, 'TIMEOUT', 'The page took too long to load.'],
        [429, 'QUOTA_EXCEEDED', 'Monthly quota reached.'],
        [429, 'RATE_LIMITED', 'Too many requests.'],
        [401, 'UNAUTHORIZED', 'Missing or invalid API key.'],
        [400, 'VALIDATION_ERROR', 'width must be at least 320'],
    ])('%s %s surfaces as "CODE: message"', async (status, code, message) => {
        stubFetch(replies([apiError({ status, code, message })]));
        const error = await snaprenderApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/v1/usage' }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(SnapRenderApiError);
        expect(error).toMatchObject({ message: `${code}: ${message}`, status, code });
    });
    test('binary requests still read the JSON error body', async () => {
        stubFetch(replies([apiError({ status: 422, code: 'TARGET_UNREACHABLE', message: 'Could not reach https://nope.invalid' })]));
        await expect(
            snaprenderApi.request({ apiKey: API_KEY, method: HttpMethod.POST, path: '/v1/screenshot', body: { url: 'https://nope.invalid' }, responseType: 'arraybuffer' }),
        ).rejects.toThrow('TARGET_UNREACHABLE: Could not reach https://nope.invalid');
    });
    test('a non-JSON error page gets a status code and a short excerpt', async () => {
        stubFetch(replies([{ status: 502, text: 'error code: 502' }]));
        const error = await snaprenderApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/v1/usage' }).catch((e: unknown) => e);
        expect(error).toMatchObject({ code: 'HTTP_502', status: 502 });
        expect(error instanceof Error ? error.message : '').toMatch(/^HTTP_502: SnapRender answered with status 502.*error code: 502/);
    });
    test('network failures are reported with a code', async () => {
        stubFetch(replies([{ throws: new Error('getaddrinfo ENOTFOUND app.snap-render.com') }]));
        await expect(snaprenderApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/v1/usage' })).rejects.toThrow(/^NETWORK_ERROR: Could not reach SnapRender: getaddrinfo ENOTFOUND/);
    });
    test('an aborted request reads as a timeout', async () => {
        const abort = new Error('This operation was aborted');
        abort.name = 'AbortError';
        stubFetch(replies([{ throws: abort }]));
        await expect(snaprenderApi.request({ apiKey: API_KEY, method: HttpMethod.GET, path: '/v1/usage', timeoutMs: 1000 })).rejects.toThrow(/^CLIENT_TIMEOUT: SnapRender did not answer within 1 seconds/);
    });
});

describe('toBuffer', () => {
    test('accepts Buffer, ArrayBuffer and typed arrays', () => {
        expect(snaprenderApi.toBuffer(PNG).equals(PNG)).toBe(true);
        expect(snaprenderApi.toBuffer(new Uint8Array(PNG)).equals(PNG)).toBe(true);
        expect(snaprenderApi.toBuffer(new Uint8Array(PNG).buffer).equals(PNG)).toBe(true);
    });
    test('rejects JSON where a file was expected', () => {
        expect(() => snaprenderApi.toBuffer({ error: 'x' })).toThrow(/did not return a file/);
    });
});
