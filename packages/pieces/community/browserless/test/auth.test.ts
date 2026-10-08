import { afterEach, describe, expect, test, vi } from 'vitest';
import { browserlessAuth } from '../src/lib/common/auth';
import { TOKEN, replies, stubFetch } from './helpers';

const props = { apiToken: TOKEN, region: 'https://production-lon.browserless.io', customBaseUrl: '' };

afterEach(() => {
    vi.unstubAllGlobals();
});

async function validate(auth: typeof props) {
    if (!browserlessAuth.validate) {
        throw new Error('validate missing');
    }
    return browserlessAuth.validate({ auth, server: { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/' } });
}

describe('auth.validate', () => {
    test('GET /meta on the selected region with the token', async () => {
        const seen = stubFetch(replies([{ body: { version: '2.40.0' } }]));
        expect(await validate(props)).toEqual({ valid: true });
        expect(seen[0].method).toBe('GET');
        expect(seen[0].url.startsWith('https://production-lon.browserless.io/meta?')).toBe(true);
        expect(seen[0].query.get('token')).toBe(TOKEN);
    });
    test.each([401, 403])('%s is an invalid token', async (status) => {
        stubFetch(replies([{ status, text: 'Invalid API key' }]));
        const result = await validate(props);
        expect(result.valid).toBe(false);
        expect(result).toMatchObject({ error: expect.stringMatching(/Invalid API token/) });
    });
    test('a 404 means the token was accepted', async () => {
        stubFetch(replies([{ status: 404, text: 'Not Found' }]));
        expect(await validate(props)).toEqual({ valid: true });
    });
    test('network failure is reported, not treated as valid', async () => {
        stubFetch(replies([{ throws: new Error('getaddrinfo ENOTFOUND') }]));
        const result = await validate(props);
        expect(result.valid).toBe(false);
    });
    test('custom endpoint without URL fails before any request', async () => {
        const seen = stubFetch(replies([{ body: {} }]));
        const result = await validate({ ...props, region: 'custom', customBaseUrl: '' });
        expect(result).toMatchObject({ valid: false, error: expect.stringMatching(/Custom Base URL is required/) });
        expect(seen).toHaveLength(0);
    });
});
