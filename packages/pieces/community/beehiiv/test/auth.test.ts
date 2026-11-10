import { afterEach, describe, expect, test, vi } from 'vitest';
import { beehiivAuth } from '../src/lib/common/auth';
import { API_KEY, stubBeehiiv } from './helpers';

afterEach(() => vi.restoreAllMocks());

async function validate({ auth }: { auth: string }) {
  const validator = beehiivAuth.validate;
  if (validator === undefined) {
    throw new Error('validate missing');
  }
  return validator({ auth, server: { apiUrl: '', publicUrl: '', token: '' } });
}

describe('auth validate', () => {
  test('valid key calls GET /publications?limit=1 with the trimmed key', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [] } }] });
    expect(await validate({ auth: ` ${API_KEY} ` })).toEqual({ valid: true });
    expect(seen[0].path).toBe('/v2/publications');
    expect(seen[0].query.get('limit')).toBe('1');
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${API_KEY}`);
  });

  test('401 is an invalid key', async () => {
    stubBeehiiv({ replies: [{ status: 401, body: { errors: [{ message: 'Unauthorized', code: 'UNAUTHORIZED' }] } }] });
    const result = await validate({ auth: API_KEY });
    expect(result.valid).toBe(false);
    expect(JSON.stringify(result)).toContain('Invalid API key');
  });

  test('500 reports the status and vendor text, not an invalid key', async () => {
    stubBeehiiv({ replies: [{ status: 500, body: { errors: [{ message: 'boom', code: 'X' }] } }] });
    const text = JSON.stringify(await validate({ auth: API_KEY }));
    expect(text).toContain('HTTP 500');
    expect(text).toContain('boom');
    expect(text).not.toContain('Invalid API key');
  });

  test('network failure says beehiiv could not be reached', async () => {
    stubBeehiiv({ replies: [{ networkError: true }] });
    expect(JSON.stringify(await validate({ auth: API_KEY }))).toContain('Could not reach beehiiv');
  });

  test('empty key is rejected without a request', async () => {
    const seen = stubBeehiiv({ replies: [{ body: {} }] });
    expect((await validate({ auth: '  ' })).valid).toBe(false);
    expect(seen).toHaveLength(0);
  });
});
