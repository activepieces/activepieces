import { HttpMethod } from '@activepieces/pieces-common';
import {
  createWorkableClient,
  cursorFromPaging,
  encodeId,
  isSameApiUrl,
  normalizeSubdomain,
  WorkableApiError,
} from '../src/lib/common/client';
import { workableAuth } from '../src/lib/auth';
import { accountsReply, AUTH, BASE, mockHttp, SUB } from './helpers';

describe('client', () => {
  it('looks up the subdomain once per client and sends bearer auth', async () => {
    const requests = mockHttp([accountsReply, { body: { jobs: [] } }, { body: { jobs: [] } }]);
    const client = createWorkableClient({ auth: AUTH });
    await client.request({ method: HttpMethod.GET, path: '/jobs' });
    await client.request({ method: HttpMethod.GET, path: '/jobs' });
    expect(requests.map((r) => r.url)).toEqual(['https://workable.com/spi/v3/accounts', `${BASE}/jobs`, `${BASE}/jobs`]);
    expect(requests[1].headers).toEqual({ Authorization: 'Bearer test-token-123', Accept: 'application/json' });
    expect(requests[1].followRedirects).toBe(false);
    expect(requests[1].redactBodyInErrors).toBe(true);
  });

  it('skips /accounts when a subdomain is given', async () => {
    const requests = mockHttp([{ body: {} }]);
    await createWorkableClient({ auth: AUTH, subdomain: ' Other ' }).request({ method: HttpMethod.GET, path: '/jobs' });
    expect(requests[0].url).toBe('https://other.workable.com/spi/v3/jobs');
  });

  it('fails clearly when the token sees no account', async () => {
    mockHttp([{ body: { accounts: [] } }]);
    await expect(createWorkableClient({ auth: AUTH }).request({ method: HttpMethod.GET, path: '/jobs' })).rejects.toThrow('cannot see any account');
  });

  it('rejects bad subdomains, IDs and paths', async () => {
    expect(() => normalizeSubdomain('evil.com/x')).toThrow('not valid');
    expect(() => normalizeSubdomain('a.b')).toThrow('not valid');
    expect(encodeId({ value: 'a b', label: 'ID' })).toBe('a%20b');
    expect(() => encodeId({ value: '..', label: 'ID' })).toThrow('not a valid');
    expect(() => encodeId({ value: '1/../x', label: 'ID' })).toThrow('not a valid');
    expect(() => encodeId({ value: '', label: 'ID' })).toThrow('ID is required');
    mockHttp([]);
    await expect(createWorkableClient({ auth: AUTH, subdomain: SUB }).request({ method: HttpMethod.GET, path: '/a/../b' })).rejects.toThrow('unexpected path');
  });

  it('only accepts next-page links on the same host and prefix', () => {
    expect(isSameApiUrl({ subdomain: SUB, candidate: `${BASE}/candidates?since_id=5` })).toBe(true);
    expect(isSameApiUrl({ subdomain: SUB, candidate: 'https://acme.workable.com.evil.io/spi/v3/candidates' })).toBe(false);
    expect(isSameApiUrl({ subdomain: SUB, candidate: 'https://user@acme.workable.com/spi/v3/x' })).toBe(false);
    expect(isSameApiUrl({ subdomain: SUB, candidate: 'http://acme.workable.com/spi/v3/x' })).toBe(false);
    expect(isSameApiUrl({ subdomain: SUB, candidate: 'https://acme.workable.com/other' })).toBe(false);
    expect(cursorFromPaging({ subdomain: SUB, body: { paging: { next: `${BASE}/candidates?limit=2&since_id=abc` } } })).toBe('abc');
    expect(cursorFromPaging({ subdomain: SUB, body: {} })).toBeNull();
    expect(() => cursorFromPaging({ subdomain: SUB, body: { paging: { next: 'https://evil.io/spi/v3/candidates?since_id=1' } } })).toThrow('different host');
  });

  it('wraps errors with responseBody and readable validation errors', async () => {
    mockHttp([{ error: { status: 422, body: { error: 'Validation failed', validation_errors: { email: ['candidate already exists'] } } } }]);
    const error = await createWorkableClient({ auth: AUTH, subdomain: SUB })
      .request({ method: HttpMethod.POST, path: '/jobs/X/candidates' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(WorkableApiError);
    expect(error).toMatchObject({ message: expect.stringContaining('email: candidate already exists') });
    expect(error).toHaveProperty('responseBody', { error: 'Validation failed', validation_errors: { email: ['candidate already exists'] } });
    expect(error).not.toHaveProperty('body');
  });

  it('retries 429 at most twice, waiting one 10 s rate-limit window each time', async () => {
    vi.useFakeTimers();
    try {
      const requests = mockHttp([
        { error: { status: 429, body: '' } },
        { error: { status: 429, body: '' } },
        { error: { status: 429, body: '' } },
      ]);
      const promise = createWorkableClient({ auth: AUTH, subdomain: SUB }).request({ method: HttpMethod.GET, path: '/jobs' }).catch((e: unknown) => e);
      await vi.advanceTimersByTimeAsync(9999);
      expect(requests).toHaveLength(1);
      await vi.advanceTimersByTimeAsync(10001);
      const error = await promise;
      expect(requests).toHaveLength(3);
      expect(error).toMatchObject({ status: 429 });
    } finally {
      vi.useRealTimers();
    }
  });

  it('validate() reports invalid credentials only on 401/403', async () => {
    const validate = (p: { auth: string }) => Reflect.apply(workableAuth.validate ?? (() => undefined), workableAuth, [p]);
    mockHttp([{ error: { status: 401, body: { error: 'Not authorized' } } }]);
    expect(await validate({ auth: 'x' })).toEqual({ valid: false, error: 'Invalid API access token.' });
    vi.restoreAllMocks();
    mockHttp([{ error: { status: 500, body: '' } }]);
    expect((await validate({ auth: 'x' })).error).toContain('server error');
    vi.restoreAllMocks();
    mockHttp([accountsReply]);
    expect(await validate({ auth: 'x' })).toEqual({ valid: true });
  });
});
