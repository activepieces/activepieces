import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { vtigerAuth } from '../src/lib/auth';
import {
  assertPublicInstanceUrl,
  isBlockedHost,
  normalizeInstanceUrl,
  vtigerRest,
  REST_UNAVAILABLE_MESSAGE,
  VtigerApiError,
} from '../src/lib/rest-client';
import { vtwsLogin } from '../src/lib/vtws';
import { basic, creds, fail, ok, SERVER, stubVtiger, vtwsRoutes } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('B8 instance URL normalisation', () => {
  test.each([
    ['https://acme.od2.vtiger.com', 'https://acme.od2.vtiger.com'],
    ['https://acme.od2.vtiger.com/', 'https://acme.od2.vtiger.com'],
    ['  https://acme.od2.vtiger.com//  ', 'https://acme.od2.vtiger.com'],
    ['http://crm.example.com:8080', 'http://crm.example.com:8080'],
  ])('%s -> %s', (input, expected) => {
    expect(normalizeInstanceUrl(input)).toBe(expected);
  });

  test.each([
    ['ftp://acme.com', 'https:// or http://'],
    ['javascript:alert(1)', 'https:// or http://'],
    ['https://user:pw@acme.com', 'username or password'],
    ['https://acme.com/restapi/v1/vtiger/default', 'without the endpoint'],
    ['https://acme.com/crm', 'path, query or fragment'],
    ['https://acme.com?x=1', 'path, query or fragment'],
    ['not a url', 'not a valid URL'],
  ])('rejects %s', (input, message) => {
    expect(() => normalizeInstanceUrl(input)).toThrow(message);
  });

  test.each([
    'localhost',
    'app.localhost',
    '127.0.0.1',
    '10.1.2.3',
    '172.16.0.1',
    '172.31.255.255',
    '192.168.1.10',
    '169.254.169.254',
    '0.0.0.0',
    '100.64.0.1',
    'metadata.google.internal',
    '[::1]',
    '[fd00::1]',
    '[fe80::1]',
    '[::ffff:7f00:1]',
    '[::ffff:a9fe:a9fe]',
  ])('blocks private host %s', (host) => {
    expect(isBlockedHost(host)).toBe(true);
  });

  test.each(['acme.od2.vtiger.com', '172.32.0.1', '8.8.8.8', '[2001:4860::8888]', 'crm.example.com'])(
    'allows public host %s',
    (host) => {
      expect(isBlockedHost(host)).toBe(false);
    }
  );

  test('decimal-encoded loopback is caught after URL parsing', () => {
    expect(() => assertPublicInstanceUrl('http://2130706433')).toThrow('private, loopback');
  });

  test('validate keeps http for self-hosted, accepts trailing slash and logs in', async () => {
    const seen = stubVtiger(vtwsRoutes());
    const result = await vtigerAuth.validate?.({
      auth: creds({ instance_url: 'http://crm.example.com/' }),
      server: SERVER,
    });
    expect(result).toEqual({ valid: true });
    expect(seen[0].origin).toBe('http://crm.example.com');
  });

  test('validate rejects metadata host before any request', async () => {
    const seen = stubVtiger([]);
    const result = await vtigerAuth.validate?.({
      auth: creds({ instance_url: 'http://169.254.169.254' }),
      server: SERVER,
    });
    expect(result?.valid).toBe(false);
    expect(seen).toHaveLength(0);
  });

  test('validate surfaces the vendor login error', async () => {
    stubVtiger([
      vtwsRoutes()[0],
      { method: 'POST', path: '/webservice.php', operation: 'login', reply: fail({ code: 'INVALID_USER_CREDENTIALS', message: 'Invalid username or password' }) },
    ]);
    const result = await vtigerAuth.validate?.({ auth: creds(), server: SERVER });
    expect(result).toEqual({
      valid: false,
      error: expect.stringContaining('INVALID_USER_CREDENTIALS: Invalid username or password'),
    });
  });
});

describe('vtigerRest', () => {
  test('sends Basic auth, Accept JSON, a TLS-verifying dispatcher and keeps credentials out of the URL', async () => {
    const seen = stubVtiger([{ method: 'GET', path: '/me', reply: ok({ id: '19x1' }) }]);
    const result = await vtigerRest({ creds: creds({ instance_url: 'https://acme.od2.vtiger.com/' }), method: HttpMethod.GET, path: 'me' });
    expect(result).toEqual({ id: '19x1' });
    expect(seen[0].url).toBe('https://acme.od2.vtiger.com/restapi/v1/vtiger/default/me');
    expect(seen[0].headers.get('authorization')).toBe(basic());
    expect(seen[0].headers.get('accept')).toBe('application/json');
    expect(seen[0].url).not.toContain('KEY123');
    expect(seen[0].dispatcher).toBeDefined();
    expect(seen[0].dispatcher?.constructor?.name).toBe('Agent');
  });

  test('POST bodies are form-urlencoded', async () => {
    const seen = stubVtiger([{ method: 'POST', path: '/delete', reply: ok({ status: 'successful' }) }]);
    await vtigerRest({ creds: creds(), method: HttpMethod.POST, path: 'delete', form: { id: '12x1' } });
    expect(seen[0].headers.get('content-type')).toContain('application/x-www-form-urlencoded');
    expect(seen[0].raw).toBe('id=12x1');
  });

  test('HTTP 200 with success:false throws code: message', async () => {
    stubVtiger([{ method: 'GET', path: '/retrieve', reply: fail({ code: 'RECORD_NOT_FOUND', message: 'Record you are trying to access is not found' }) }]);
    const call = vtigerRest({ creds: creds(), method: HttpMethod.GET, path: 'retrieve', query: { id: '12x9' } });
    await expect(call).rejects.toThrow('RECORD_NOT_FOUND: Record you are trying to access is not found');
    await expect(call).rejects.toBeInstanceOf(VtigerApiError);
  });

  test('HTTP 401 without an envelope maps to a permission message', async () => {
    stubVtiger([{ method: 'GET', path: '/me', reply: { status: 401, body: 'Unauthorized' } }]);
    await expect(vtigerRest({ creds: creds(), method: HttpMethod.GET, path: 'me' })).rejects.toThrow(
      'HTTP_401: Vtiger rejected the username or access key'
    );
  });

  test('error envelope on a 4xx keeps the vendor code', async () => {
    stubVtiger([{ method: 'GET', path: '/me', reply: fail({ code: 'ACCESS_DENIED', message: 'Permission to perform the operation is denied', status: 403 }) }]);
    await expect(vtigerRest({ creds: creds(), method: HttpMethod.GET, path: 'me' })).rejects.toThrow(
      'ACCESS_DENIED: Permission to perform the operation is denied'
    );
  });

  test('a redirect is not followed', async () => {
    stubVtiger([{ method: 'GET', path: '/me', reply: { status: 301, headers: { location: 'https://evil.example/' } } }]);
    await expect(vtigerRest({ creds: creds(), method: HttpMethod.GET, path: 'me' })).rejects.toThrow('HTTP_301');
  });

  test('REST 404 with an HTML body explains that the action needs Vtiger Cloud', async () => {
    stubVtiger([]);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<html><h1>Not Found</h1></html>', { status: 404, headers: { 'content-type': 'text/html' } }))
    );
    const call = vtigerRest({ creds: creds({ instance_url: 'http://crm.example.com' }), method: HttpMethod.GET, path: 'me' });
    await expect(call).rejects.toThrow(REST_UNAVAILABLE_MESSAGE);
    await expect(call).rejects.toMatchObject({ code: 'REST_API_UNAVAILABLE' });
  });

  test('a webservice.php 404 keeps the generic message', async () => {
    stubVtiger([]);
    await expect(vtwsLogin(creds())).rejects.toThrow('NO_STUB: GET /webservice.php');
  });

  test('HTTP 400 with an empty body gets a hint, 429 does not repeat the code', async () => {
    stubVtiger([
      { method: 'GET', path: '/me', reply: { status: 400 } },
      { method: 'GET', path: '/sync', reply: fail({ code: 'TOO_MANY_REQUESTS', message: 'TOO_MANY_REQUESTS', status: 429 }) },
    ]);
    await expect(vtigerRest({ creds: creds(), method: HttpMethod.GET, path: 'me' })).rejects.toThrow('may not exist');
    await expect(vtigerRest({ creds: creds(), method: HttpMethod.GET, path: 'sync' })).rejects.toThrow(
      'TOO_MANY_REQUESTS: Vtiger rate limit reached; retry later'
    );
  });

  test('body without success flag is an error, not a success', async () => {
    stubVtiger([{ method: 'GET', path: '/me', reply: { body: { result: { id: 1 } } } }]);
    await expect(vtigerRest({ creds: creds(), method: HttpMethod.GET, path: 'me' })).rejects.toThrow('HTTP_200');
  });
});
