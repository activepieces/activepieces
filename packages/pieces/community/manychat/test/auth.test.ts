import { afterEach, describe, expect, test, vi } from 'vitest';
import { manychatAuth } from '../src/lib/auth';
import { API_KEY, ok, stubManychat } from './helpers';

afterEach(() => vi.restoreAllMocks());

async function validate({ auth }: { auth: string }) {
  const validator = manychatAuth.validate;
  if (validator === undefined) {
    throw new Error('validate missing');
  }
  return validator({ auth, server: { apiUrl: '', publicUrl: '', token: '' } });
}

describe('auth validate', () => {
  test('a valid key calls GET /page/getInfo with the trimmed key', async () => {
    const seen = stubManychat({ replies: [ok({ data: { id: 1 } })] });
    expect(await validate({ auth: ` ${API_KEY} ` })).toEqual({ valid: true });
    expect(seen[0].path).toBe('/fb/page/getInfo');
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${API_KEY}`);
  });

  test('401 is an invalid key', async () => {
    stubManychat({ replies: [{ status: 401, body: { status: 'error', message: 'Wrong token' } }] });
    const text = JSON.stringify(await validate({ auth: API_KEY }));
    expect(text).toContain('Invalid API key');
    expect(text).toContain('Wrong token');
  });

  test('500 and 429 report the status and vendor text, not an invalid key', async () => {
    stubManychat({ replies: [{ status: 500, body: { status: 'error', message: 'boom' } }] });
    const text = JSON.stringify(await validate({ auth: API_KEY }));
    expect(text).toContain('HTTP 500');
    expect(text).toContain('boom');
    expect(text).not.toContain('Invalid API key');
  });

  test('network failure says ManyChat could not be reached', async () => {
    stubManychat({ replies: [{ networkError: true }] });
    expect(JSON.stringify(await validate({ auth: API_KEY }))).toContain('Could not reach ManyChat');
  });

  test('an empty key is rejected without a request', async () => {
    const seen = stubManychat({ replies: [ok()] });
    expect((await validate({ auth: '  ' })).valid).toBe(false);
    expect(seen).toHaveLength(0);
  });
});
