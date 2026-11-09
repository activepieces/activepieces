import { afterEach, describe, expect, test, vi } from 'vitest';
import { snaprenderAuth } from '../src/lib/auth';
import { API_KEY, apiError, replies, stubFetch } from './helpers';

afterEach(() => {
    vi.unstubAllGlobals();
});

async function validate(auth: string) {
    if (!snaprenderAuth.validate) {
        throw new Error('validate missing');
    }
    return snaprenderAuth.validate({ auth, server: { apiUrl: 'http://localhost:3000/api/', publicUrl: 'http://localhost:4200/', mintOidcToken: async () => 'token' } });
}

describe('auth.validate', () => {
    test('checks the key with GET /v1/usage', async () => {
        const seen = stubFetch(replies([{ body: { plan: 'free', usage: { screenshots_used: 1, screenshots_limit: 200, screenshots_remaining: 199 } } }]));
        expect(await validate(API_KEY)).toEqual({ valid: true });
        expect(seen[0].method).toBe('GET');
        expect(seen[0].url).toBe('https://app.snap-render.com/v1/usage');
        expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
    });
    test.each([401, 403])('%s means the key is wrong', async (status) => {
        stubFetch(replies([apiError({ status, code: 'UNAUTHORIZED', message: 'Missing or invalid API key.' })]));
        const result = await validate('sk_live_wrong');
        expect(result).toMatchObject({ valid: false, error: expect.stringMatching(/Invalid API key/) });
    });
    test('an empty key fails without a request', async () => {
        const seen = stubFetch(replies([{ body: {} }]));
        expect(await validate('   ')).toMatchObject({ valid: false });
        expect(seen).toHaveLength(0);
    });
    test('a network failure is reported, not accepted', async () => {
        stubFetch(replies([{ throws: new Error('getaddrinfo ENOTFOUND') }]));
        expect(await validate(API_KEY)).toMatchObject({ valid: false, error: expect.stringMatching(/NETWORK_ERROR/) });
    });
    test('the help text links to signup and the key page', () => {
        expect(snaprenderAuth.description).toContain('https://app.snap-render.com/auth/signup');
        expect(snaprenderAuth.description).toContain('https://app.snap-render.com/dashboard/keys');
    });
});
