import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { BrowserlessApiError, browserlessApi } from '../src/lib/common/client';
import { TOKEN, replies, stubFetch } from './helpers';

const sfo = { apiToken: TOKEN, region: 'https://production-sfo.browserless.io' };

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('base URL', () => {
    test('uses the selected shared region', () => {
        expect(browserlessApi.resolveBaseUrl(sfo)).toBe('https://production-sfo.browserless.io');
    });
    test('rejects an unknown region value', () => {
        expect(() => browserlessApi.resolveBaseUrl({ apiToken: TOKEN, region: 'https://evil.example' })).toThrow(/Unknown Browserless region/);
    });
    test('normalizes a custom endpoint and keeps a path prefix', () => {
        expect(browserlessApi.resolveBaseUrl({ apiToken: TOKEN, region: 'custom', customBaseUrl: ' https://chrome.browserless.io/ ' })).toBe('https://chrome.browserless.io');
        expect(browserlessApi.resolveBaseUrl({ apiToken: TOKEN, region: 'custom', customBaseUrl: 'http://10.0.0.5:3000/bl/' })).toBe('http://10.0.0.5:3000/bl');
    });
    test.each([
        ['', /Custom Base URL is required/],
        ['chrome.browserless.io', /not a valid URL/],
        ['ftp://chrome.browserless.io', /https:\/\/ or http:\/\//],
        ['https://user:pw@chrome.browserless.io', /username or password/],
        ['https://chrome.browserless.io?token=abc', /query string/],
    ])('rejects custom base URL %s', (customBaseUrl, message) => {
        expect(() => browserlessApi.resolveBaseUrl({ apiToken: TOKEN, region: 'custom', customBaseUrl })).toThrow(message);
    });
});

describe('same-target check for the custom API call', () => {
    test.each([
        ['https://production-sfo.browserless.io/meta', true],
        ['https://production-sfo.browserless.io.evil.io/meta', false],
        ['https://evil.io/production-sfo.browserless.io', false],
        ['http://production-sfo.browserless.io/meta', false],
        ['https://user@production-sfo.browserless.io/meta', false],
        ['//evil.io/meta', false],
    ])('%s -> %s', (url, expected) => {
        expect(browserlessApi.isSameTarget({ baseUrl: 'https://production-sfo.browserless.io', url })).toBe(expected);
    });
    test('respects a custom base path prefix and refuses traversal', () => {
        const baseUrl = 'https://bl.example.com/api';
        expect(browserlessApi.isSameTarget({ baseUrl, url: 'https://bl.example.com/api/meta' })).toBe(true);
        expect(browserlessApi.isSameTarget({ baseUrl, url: 'https://bl.example.com/apix/meta' })).toBe(false);
        expect(browserlessApi.isSameTarget({ baseUrl, url: 'https://bl.example.com/api/%2e%2e/admin' })).toBe(false);
    });
});

describe('request', () => {
    test('sends the token as a query param to the region host, JSON body, no redirects', async () => {
        const seen = stubFetch(replies([{ body: { ok: true } }]));
        const response = await browserlessApi.request({ auth: sfo, method: HttpMethod.POST, path: '/content', body: { url: 'https://example.com' }, query: { blockAds: true, empty: '', none: undefined }, operation: 'Test' });
        expect(response.body).toEqual({ ok: true });
        expect(seen[0].origin).toBe('https://production-sfo.browserless.io');
        expect(seen[0].path).toBe('/content');
        expect(seen[0].query.get('token')).toBe(TOKEN);
        expect(seen[0].query.get('blockAds')).toBe('true');
        expect(seen[0].query.has('empty')).toBe(false);
        expect(seen[0].query.has('none')).toBe(false);
        expect(seen[0].headers.get('content-type')).toBe('application/json');
        expect(seen[0].redirect).toBe('manual');
        expect(seen[0].body).toEqual({ url: 'https://example.com' });
    });
    test('trims the token and refuses an empty one before any request', async () => {
        const seen = stubFetch(replies([{ body: {} }]));
        await browserlessApi.request({ auth: { ...sfo, apiToken: `  ${TOKEN} ` }, method: HttpMethod.GET, path: '/meta', operation: 'Test' });
        expect(seen[0].query.get('token')).toBe(TOKEN);
        await expect(browserlessApi.request({ auth: { ...sfo, apiToken: '  ' }, method: HttpMethod.GET, path: '/meta', operation: 'Test' })).rejects.toThrow(/token is empty/);
        expect(seen).toHaveLength(1);
    });
    test('refuses absolute or protocol-relative paths', async () => {
        await expect(browserlessApi.request({ auth: sfo, method: HttpMethod.GET, path: '//evil.io/x', operation: 'Test' })).rejects.toThrow(/Invalid Browserless path/);
        await expect(browserlessApi.request({ auth: sfo, method: HttpMethod.GET, path: 'https://evil.io', operation: 'Test' })).rejects.toThrow(/Invalid Browserless path/);
    });
    test('401 becomes a clear error with responseBody and no body field', async () => {
        stubFetch(replies([{ status: 401, text: 'Invalid API key. Please check your API key and try again.' }]));
        const error = await browserlessApi.request({ auth: sfo, method: HttpMethod.GET, path: '/meta', operation: 'Check' }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(BrowserlessApiError);
        if (!(error instanceof BrowserlessApiError)) {
            return;
        }
        expect(error.status).toBe(401);
        expect(error.message).toMatch(/^Check failed: Browserless refused the API token \(401\).*Invalid API key/);
        expect(error.responseBody).toContain('Invalid API key');
        expect('body' in error).toBe(false);
    });
    test.each([
        [400, /rejected the request \(400\)/],
        [408, /did not finish within the timeout \(408\)/],
        [429, /concurrency limit/],
        [503, /internal error \(503\)/],
    ])('status %s is explained', async (status, message) => {
        stubFetch(replies([{ status, body: { message: 'vendor says no' } }]));
        await expect(browserlessApi.request({ auth: sfo, method: HttpMethod.POST, path: '/pdf', body: {}, operation: 'PDF' })).rejects.toThrow(message);
    });
    test.each([301, 302, 307, 308])('status %s is an error, not a result', async (status) => {
        stubFetch(replies([{ status, text: 'moved' }]));
        const error = await browserlessApi.request({ auth: sfo, method: HttpMethod.POST, path: '/pdf', body: {}, responseType: 'arraybuffer', operation: 'PDF' }).catch((e: unknown) => e);
        expect(error).toBeInstanceOf(BrowserlessApiError);
        if (!(error instanceof BrowserlessApiError)) {
            return;
        }
        expect(error.status).toBe(status);
        expect(error.message).toMatch(new RegExp(`^PDF failed: Browserless answered with status ${status}.*Redirects are not followed`));
    });
    test('clamps the client deadline', () => {
        expect(browserlessApi.clampTimeout(undefined)).toBe(300_000);
        expect(browserlessApi.clampTimeout(10_000)).toBe(10_000);
        expect(browserlessApi.clampTimeout(9_999_999)).toBe(540_000);
        expect(browserlessApi.clampTimeout(-1)).toBe(300_000);
    });
    test('reads site status headers', () => {
        expect(browserlessApi.siteResponse({ 'x-response-code': '404', 'x-response-status': 'Not Found', 'x-response-url': 'https://example.com/x' })).toEqual({
            site_status_code: 404,
            site_status_text: 'Not Found',
            final_url: 'https://example.com/x',
        });
        expect(browserlessApi.siteResponse({})).toEqual({ site_status_code: null, site_status_text: null, final_url: null });
    });
});
