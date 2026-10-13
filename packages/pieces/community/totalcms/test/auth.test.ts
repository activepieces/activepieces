import { afterEach, describe, expect, test, vi } from 'vitest';
import { cmsAuth } from '../src/lib/auth';
import { stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const validate = (auth: { domain: string; apiKey: string }) => cmsAuth.validate!({ auth, server: { apiUrl: '', publicUrl: '', token: '' } });

describe('auth validate', () => {
  test('accepts a Total CMS 3 site', async () => {
    const seen = stubFetch(() => ({ body: { data: [] } }));
    expect(await validate({ domain: 'https://cms.example.com/', apiKey: ' tcms_x ' })).toEqual({ valid: true });
    expect(seen[0].url).toBe('https://cms.example.com/api/collections');
    expect(seen[0].headers.get('x-api-key')).toBe('tcms_x');
  });

  test('rejects a bad key, a redirect, a non-CMS page and a bad URL', async () => {
    stubFetch(() => ({ status: 401, body: { error: { message: 'Unauthorized' } } }));
    expect(await validate({ domain: 'https://cms.example.com', apiKey: 'bad' })).toMatchObject({ valid: false, error: expect.stringContaining('API key') });
    stubFetch(() => ({ status: 301, body: {}, headers: { location: 'https://www.cms.example.com/api/collections' } }));
    expect(await validate({ domain: 'https://cms.example.com', apiKey: 'k' })).toMatchObject({ valid: false, error: expect.stringContaining('redirects') });
    stubFetch(() => ({ text: '<html>hello</html>' }));
    expect(await validate({ domain: 'https://cms.example.com', apiKey: 'k' })).toMatchObject({ valid: false, error: expect.stringContaining('Total CMS 3') });
    expect(await validate({ domain: 'ftp://cms.example.com', apiKey: 'k' })).toMatchObject({ valid: false });
  });
});
