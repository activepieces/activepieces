import { afterEach, describe, expect, test, vi } from 'vitest';
import { BikaAuth } from '../src/lib/auth';
import { ok, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const validate = (token: string) => {
  if (!BikaAuth.validate) {
    throw new Error('validate missing');
  }
  return BikaAuth.validate({ auth: { token }, server: { apiUrl: '', publicUrl: '', token: '' } });
};

describe('auth validate', () => {
  test('accepts a working token', async () => {
    const seen = stubFetch(() => ok([]));
    expect(await validate(' tok ')).toEqual({ valid: true });
    expect(seen[0].url).toBe('https://bika.ai/api/openapi/bika/v1/spaces');
  });

  test('says invalid token only on 401 or 403', async () => {
    stubFetch(() => ({ status: 401, body: { success: false, code: 401, message: 'Unauthorized' } }));
    expect(await validate('bad')).toMatchObject({ valid: false, error: expect.stringContaining('Invalid token') });
  });

  test('passes other failures through instead of blaming the token', async () => {
    stubFetch(() => ({ status: 500, body: { success: false, code: 500, message: 'Server busy' } }));
    const result = await validate('tok');
    expect(result).toMatchObject({ valid: false, error: expect.stringContaining('Server busy') });
    expect(JSON.stringify(result)).not.toContain('Invalid token');
  });
});
