import { HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { gscClient, GscApiError } from '../src/lib/common/client';
import { googleError, stubFetch, TOKEN } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const auth = { access_token: TOKEN };

describe('gscClient.request', () => {
  test('sends the bearer token to searchconsole.googleapis.com and encodes the property', async () => {
    const seen = stubFetch(() => ({ body: { siteUrl: 'sc-domain:example.com', permissionLevel: 'siteOwner' } }));
    await gscClient.request({ auth, method: HttpMethod.GET, path: gscClient.sitePath('sc-domain:example.com'), operation: 'x' });
    expect(seen[0].url).toBe('https://searchconsole.googleapis.com/webmasters/v3/sites/sc-domain%3Aexample.com');
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${TOKEN}`);
    expect(seen[0].headers.get('accept')).toBe('application/json');
  });

  test('sends every request through an agent that checks HTTPS certificates', async () => {
    stubFetch(() => ({ body: {} }));
    await gscClient.request({ auth, method: HttpMethod.GET, path: ['webmasters', 'v3', 'sites'], operation: 'x' });
    const init = vi.mocked(fetch).mock.calls[0][1];
    const dispatcher = Reflect.get(Object(init), 'dispatcher');
    expect(dispatcher?.constructor?.name).toBe('Agent');
  });

  test('maps a 403 permission error to a site URL hint and keeps Google text', async () => {
    const message = "User does not have sufficient permission for site 'https://example.com/'. See also: https://support.google.com/webmasters/answer/2451999.";
    stubFetch(() => ({ status: 403, body: googleError({ code: 403, message }) }));
    const error = await gscClient.request({ auth, method: HttpMethod.GET, path: ['webmasters', 'v3', 'sites'], operation: 'list sites' }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GscApiError);
    const text = String(Reflect.get(Object(error), 'message'));
    expect(text).toContain('must match the property exactly');
    expect(text).toContain(message);
    expect(text).toContain('HTTP 403');
    expect(Reflect.get(Object(error), 'body')).toBeUndefined();
    expect(Reflect.get(Object(error), 'responseBody')).toBeDefined();
  });

  test('maps SERVICE_DISABLED to an enable-the-API hint', async () => {
    stubFetch(() => ({
      status: 403,
      body: {
        error: {
          code: 403,
          message: 'Google Search Console API has not been used in project 123 before or it is disabled.',
          status: 'PERMISSION_DENIED',
          details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'SERVICE_DISABLED' }],
        },
      },
    }));
    await expect(gscClient.request({ auth, method: HttpMethod.GET, path: ['webmasters', 'v3', 'sites'], operation: 'x' })).rejects.toThrow(
      'Enable "Google Search Console API"',
    );
  });

  test('maps 401, 404, 429 and 5xx', async () => {
    const replies: Record<string, FakeStatus> = { a: 401, b: 404, c: 429, d: 503 };
    stubFetch((request) => {
      const status = replies[request.url.slice(-1)];
      return { status, body: googleError({ code: status, message: `status ${status}` }) };
    });
    await expect(gscClient.request({ auth, method: HttpMethod.GET, path: ['a'], operation: 'x' })).rejects.toThrow('expired or was revoked');
    await expect(gscClient.request({ auth, method: HttpMethod.GET, path: ['b'], operation: 'x' })).rejects.toThrow('not found');
    await expect(gscClient.request({ auth, method: HttpMethod.GET, path: ['c'], operation: 'x' })).rejects.toThrow('quota was exceeded');
    await expect(gscClient.request({ auth, method: HttpMethod.GET, path: ['d'], operation: 'x' })).rejects.toThrow('temporarily unavailable');
  });

  test('describes a non-JSON error body', () => {
    expect(gscClient.describeGscError({ status: 400, responseBody: 'Bad Request' })).toContain('Google said: "Bad Request" (HTTP 400)');
  });
});

type FakeStatus = number;
