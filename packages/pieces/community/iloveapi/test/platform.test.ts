import { Readable } from 'stream';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { iLoveApi } from '../src/lib/common/client';
import { iloveHost } from '../src/lib/common/host';
import { iloveapiAuth } from '../src/lib/common/auth';
import { iloveapi } from '../src/index';
import { defaultRoutes, loose, mockHttp, record } from './helpers';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('host allow-list', () => {
  it.each(['api11.ilovepdf.com', 'api8g.iloveimg.com', 'api.iloveapi.com'])('accepts %s', (host) => {
    expect(iloveHost.assertServerHost(host)).toBe(host);
  });
  it.each(['api.ilovepdf.com.evil.io', 'user@api.ilovepdf.com', '//api.ilovepdf.com', 'evil.com/x.ilovepdf.com', 'api.ilovepdf.com:444', '', undefined])(
    'refuses %s',
    (host) => {
      expect(() => iloveHost.assertServerHost(host)).toThrow(/unexpected server/);
    }
  );
  it('refuses URLs with credentials, ports or http', () => {
    expect(iloveHost.isAllowedUrl('https://u:p@api.ilovepdf.com/v1')).toBe(false);
    expect(iloveHost.isAllowedUrl('http://api.ilovepdf.com/v1')).toBe(false);
    expect(iloveHost.isAllowedUrl('https://api.ilovepdf.com:8443/v1')).toBe(false);
    expect(iloveHost.isAllowedUrl('https://api.ilovepdf.com/v1')).toBe(true);
  });
});

describe('request helper', () => {
  it('trims the key, redacts the auth body and verifies TLS', async () => {
    const calls = mockHttp(defaultRoutes());
    await iLoveApi.authenticate({ publicKey: ' key ' });
    expect(calls[0]).toMatchObject({ body: { public_key: 'key' }, redact: true, hasDispatcher: true, followRedirects: false });
  });

  it('retries a 429 with backoff and then succeeds', async () => {
    vi.useFakeTimers();
    let count = 0;
    mockHttp([
      {
        method: 'POST',
        match: () => true,
        reply: () => {
          count += 1;
          return count < 3 ? { status: 429, body: { error: { message: 'slow down' } } } : { body: { token: 't' } };
        },
      },
    ]);
    const promise = iLoveApi.authenticate({ publicKey: 'k' });
    await vi.advanceTimersByTimeAsync(10_000);
    await expect(promise).resolves.toBe('t');
    expect(count).toBe(3);
  });

  it('gives up after repeated 429s with a rate limit message', async () => {
    vi.useFakeTimers();
    mockHttp([{ method: 'POST', match: () => true, status: 429, body: {} }]);
    const promise = iLoveApi.authenticate({ publicKey: 'k' }).catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(60_000);
    const error = await promise;
    expect(String(error)).toMatch(/rate limit/);
    expect(error).toHaveProperty('status', 429);
  });

  it('caps download size', async () => {
    const big = Buffer.alloc(1024 * 1024);
    mockHttp([
      {
        method: 'GET',
        match: () => true,
        reply: () => ({ body: Readable.from(Array.from({ length: 101 }, () => big)) }),
      },
    ]);
    await expect(iLoveApi.downloadResult({ token: 't', server: 'api1.ilovepdf.com', task: 'T' })).rejects.toThrow(/100 MB/);
  });

  it('enforces its own download deadline', async () => {
    vi.useFakeTimers();
    mockHttp([{ method: 'GET', match: () => true, reply: () => ({ body: new Readable({ read() { return; } }) }) }]);
    const promise = iLoveApi.downloadResult({ token: 't', server: 'api1.ilovepdf.com', task: 'T' }).catch((e: Error) => e);
    await vi.advanceTimersByTimeAsync(121_000);
    expect(String(await promise)).toMatch(/did not finish/);
  });
});

describe('auth validate', () => {
  it('reports invalid only on 401/403', async () => {
    mockHttp([{ method: 'POST', match: () => true, status: 401, body: { name: 'Unauthorized' } }]);
    await expect(iloveapiAuth.validate?.(loose({ auth: 'k' }))).resolves.toEqual({ valid: false, error: 'Invalid iLoveAPI project public key.' });
    vi.restoreAllMocks();
    mockHttp([{ method: 'POST', match: () => true, status: 500, body: { name: 'ServerError' } }]);
    const result = await iloveapiAuth.validate?.(loose({ auth: 'k' }));
    expect(result).toMatchObject({ valid: false });
    expect(record(result)['error']).toMatch(/Could not verify/);
  });
  it('accepts a working key', async () => {
    mockHttp(defaultRoutes());
    await expect(iloveapiAuth.validate?.(loose({ auth: 'k' }))).resolves.toEqual({ valid: true });
  });
});

describe('custom api call', () => {
  const action = iloveapi.actions()['custom_api_call'];
  async function headersFor(url: string): Promise<unknown> {
    mockHttp([...defaultRoutes(), { method: 'GET', match: () => true, body: {} }]);
    const props = record(action.props);
    expect(props).toBeDefined();
    return action.run(loose({
      auth: { type: 'SECRET_TEXT', secret_text: 'k' },
      propsValue: { url: { url }, method: 'GET', headers: {}, queryParams: {}, failsafe: false },
    }));
  }
  it.each([
    'https://api.ilovepdf.com.evil.io/v1/x',
    'https://evil.io/v1/x',
    '//evil.io/v1',
    'https://api.ilovepdf.com/v2/x',
    'https://user@api.ilovepdf.com/v1/x',
    '../../x',
    '%2e%2e/x',
  ])('refuses %s', async (url) => {
    await expect(headersFor(url)).rejects.toThrow(/only sends your iLoveAPI credentials|not valid/);
  });
  it('allows a relative path on the base', async () => {
    await expect(headersFor('signature/list')).resolves.toBeDefined();
  });
});
