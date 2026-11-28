import { afterEach, describe, expect, test, vi } from 'vitest';
import { firefliesAiAuth } from '../src/lib/auth';

afterEach(() => vi.unstubAllGlobals());

describe('auth.validate', () => {
  test('a key that returns the owner is valid, and the key is sent as a bearer token', async () => {
    const seen = stubFetch({ status: 200, body: { data: { user: { user_id: 'u1', email: 'a@example.com' } } } });
    await expect(validate({ auth: ' key-1 ' })).resolves.toEqual({ valid: true });
    expect(seen).toEqual(['Bearer key-1']);
  });

  test('a vendor error reports the status, code and vendor message, not a blanket invalid key', async () => {
    stubFetch({ status: 200, body: { data: null, errors: [{ message: 'Invalid API key', code: 'forbidden', extensions: { status: 403 } }] } });
    const result = await validate({ auth: 'bad' });
    expect(result.valid).toBe(false);
    const error = 'error' in result ? String(result.error) : '';
    expect(error).toContain('code forbidden');
    expect(error).toContain('Invalid API key');
  });

  test('a server error is reported as such', async () => {
    stubFetch({ status: 503, body: 'Service Unavailable' });
    const result = await validate({ auth: 'k' });
    expect(result.valid).toBe(false);
    expect('error' in result ? String(result.error) : '').toContain('HTTP 503');
  });

  test('a response with no user is not valid', async () => {
    stubFetch({ status: 200, body: { data: { user: null } } });
    await expect(validate({ auth: 'k' })).resolves.toMatchObject({ valid: false });
  });
});

async function validate({ auth }: { auth: string }): Promise<{ valid: boolean; error?: unknown }> {
  const validator = firefliesAiAuth.validate;
  if (!validator) {
    throw new Error('validate is missing');
  }
  return validator({ auth, server: Object.assign(Object.create(null), { apiUrl: '', publicUrl: '' }) });
}

function stubFetch({ status, body }: { status: number; body: unknown }): (string | null)[] {
  const authorizations: (string | null)[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
      authorizations.push(new Headers(init?.headers).get('authorization'));
      return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
    }),
  );
  return authorizations;
}
