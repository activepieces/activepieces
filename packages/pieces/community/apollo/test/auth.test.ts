import { afterEach, describe, expect, test, vi } from 'vitest';
import { apolloAuth } from '../src/lib/auth';
import { TEST_SERVER, replies, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('auth validate', () => {
  test('200 is valid and calls the free profile endpoint with the trimmed key', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { id: 'u1' } }] }) });
    expect(await apolloAuth.validate?.({ auth: ' key ', server: TEST_SERVER })).toEqual({ valid: true });
    expect(seen[0].method).toBe('GET');
    expect(seen[0].path).toBe('/api/v1/users/api_profile');
    expect(seen[0].headers.get('x-api-key')).toBe('key');
  });

  test('401 is an invalid key', async () => {
    stubFetch({ respond: replies({ list: [{ status: 401, body: 'Invalid API key.' }] }) });
    expect(await apolloAuth.validate?.({ auth: 'bad', server: TEST_SERVER })).toEqual({ valid: false, error: expect.stringContaining('Invalid Apollo API key') });
  });

  test('403 API_INACCESSIBLE (scoped key without this endpoint) is still valid', async () => {
    stubFetch({ respond: replies({ list: [{ status: 403, body: { error: 'not authorized', error_code: 'API_INACCESSIBLE' } }] }) });
    expect(await apolloAuth.validate?.({ auth: 'scoped', server: TEST_SERVER })).toEqual({ valid: true });
  });

  test('another 403 shows the vendor text, not "invalid key"', async () => {
    stubFetch({ respond: replies({ list: [{ status: 403, body: { message: 'Your account is suspended.' } }] }) });
    const result = await apolloAuth.validate?.({ auth: 'k', server: TEST_SERVER });
    expect(result).toEqual({ valid: false, error: 'Apollo refused this API key: Your account is suspended.' });
  });

  test('5xx and network errors have their own messages', async () => {
    stubFetch({ respond: replies({ list: [{ status: 500, body: { error: 'oops' } }] }) });
    expect(await apolloAuth.validate?.({ auth: 'k', server: TEST_SERVER })).toEqual({ valid: false, error: expect.stringContaining('could not check the key right now (500)') });
    stubFetch({ respond: replies({ list: [{ networkError: true }] }) });
    expect(await apolloAuth.validate?.({ auth: 'k', server: TEST_SERVER })).toEqual({ valid: false, error: expect.stringContaining('Could not reach Apollo') });
  });

  test('an empty key is rejected without a request', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: {} }] }) });
    expect(await apolloAuth.validate?.({ auth: '  ', server: TEST_SERVER })).toEqual({ valid: false, error: 'Enter your Apollo API key.' });
    expect(seen).toHaveLength(0);
  });
});
