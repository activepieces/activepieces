import { afterEach, describe, expect, test, vi } from 'vitest';
import { activeCampaignAuth } from '../src/lib/auth';

afterEach(() => vi.unstubAllGlobals());

describe('auth validate', () => {
  test('valid on 200 from /users/me', async () => {
    const urls = stubFetch({ status: 200, body: { user: { id: '1' } } });
    expect(await validate({ apiUrl: 'acme.api-us1.com/api/3/', apiKey: 'k' })).toEqual({ valid: true });
    expect(urls).toEqual(['https://acme.api-us1.com/api/3/users/me']);
  });

  test.each([401, 403])('%s reports invalid credentials', async (status) => {
    stubFetch({ status, body: { message: 'No access' } });
    const result = await validate({ apiUrl: 'https://acme.api-us1.com', apiKey: 'bad' });
    expect(result).toMatchObject({ valid: false });
    expect(errorOf(result)).toContain('Invalid API URL or key');
  });

  test('a 500 reports the status and vendor text, not invalid credentials', async () => {
    stubFetch({ status: 500, body: { message: 'Internal failure' } });
    const result = errorOf(await validate({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' }));
    expect(result).toContain('(500): Internal failure');
    expect(result).not.toContain('Invalid API URL or key');
  });

  test('a DNS failure reports the host could not be reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } });
      }),
    );
    expect(errorOf(await validate({ apiUrl: 'https://typo.api-us1.com', apiKey: 'k' }))).toBe(
      'Could not reach typo.api-us1.com: ENOTFOUND. Check the API URL in the connection.',
    );
  });

  test('an http:// URL is upgraded to https:// on the same host', async () => {
    const urls = stubFetch({ status: 200, body: { user: { id: '1' } } });
    expect(await validate({ apiUrl: 'http://acme.api-us1.com', apiKey: 'k' })).toEqual({ valid: true });
    expect(urls).toEqual(['https://acme.api-us1.com/api/3/users/me']);
  });

  test('a non-http scheme is refused before any request', async () => {
    const urls = stubFetch({ status: 200, body: {} });
    expect(errorOf(await validate({ apiUrl: 'ftp://acme.api-us1.com', apiKey: 'k' }))).toContain('https://');
    expect(urls).toEqual([]);
  });
});

async function validate({ apiUrl, apiKey }: { apiUrl: string; apiKey: string }): Promise<unknown> {
  const validator = activeCampaignAuth.validate;
  if (!validator) {
    throw new Error('validate missing');
  }
  return validator(Object.assign(Object.create(null), { auth: { apiUrl, apiKey } }));
}

function errorOf(result: unknown): string {
  return typeof result === 'object' && result !== null && 'error' in result ? String(result.error) : '';
}

function stubFetch({ status, body }: { status: number; body: unknown }): string[] {
  const urls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      urls.push(input);
      return new Response(JSON.stringify(body), { status });
    }),
  );
  return urls;
}
