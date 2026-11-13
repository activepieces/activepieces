import { afterEach, describe, expect, test, vi } from 'vitest';
import { zoomAuth } from '../src';

const server = {
  apiUrl: 'http://localhost:3000/api/',
  publicUrl: 'http://localhost:4200/',
};

function stubFetch(respond: (request: FetchRequest) => FakeResponse): Seen[] {
  const seen: Seen[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = input instanceof Request ? input.url : String(input);
      const method = (
        init?.method ?? (input instanceof Request ? input.method : 'GET')
      ).toUpperCase();
      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined)
      );
      const body = typeof init?.body === 'string' ? init.body : null;
      seen.push({
        url,
        method,
        auth: headers.get('authorization'),
        headers,
        body,
      });
      const r = respond({ url, method });
      return new Response(JSON.stringify(r.body), {
        status: r.status,
        headers: { 'content-type': 'application/json' },
      });
    })
  );
  return seen;
}

function oauth(extra: Partial<ZoomOAuthValue> = {}): ZoomOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function run(extra: Partial<ZoomOAuthValue> = {}) {
  const hook = zoomAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('zoomAuth has no getConnectionIdentifier hook');
  }
  return hook({ auth: oauth(extra), server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('zoom getConnectionIdentifier', () => {
  test('happy path: email from GET /v2/users/me with the bearer token', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { id: 'u1', email: 'pat@acme.com', display_name: 'Pat Lee' },
    }));
    expect(await run()).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.zoom.us/v2/users/me');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('falls back to display_name when email is missing', async () => {
    stubFetch(() => ({
      status: 200,
      body: { id: 'u1', display_name: 'Pat Lee' },
    }));
    expect(await run()).toBe('Pat Lee');
  });

  test('falls back to display_name when email is an empty string', async () => {
    stubFetch(() => ({
      status: 200,
      body: { id: 'u1', email: '', display_name: 'Pat Lee' },
    }));
    expect(await run()).toBe('Pat Lee');
  });

  test('returns undefined when email and display_name are both empty', async () => {
    stubFetch(() => ({
      status: 200,
      body: { id: 'u1', email: '', display_name: '' },
    }));
    expect(await run()).toBeUndefined();
  });

  test('token data is ignored: the call is still made (Zoom puts no identity in the token response)', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { email: 'pat@acme.com' },
    }));
    expect(
      await run({
        data: { scope: 'meeting:read:meeting', api_url: 'https://api.zoom.us' },
      })
    ).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
  });

  test('400 missing-scope response -> undefined, no throw', async () => {
    stubFetch(() => ({
      status: 400,
      body: {
        code: 4711,
        message:
          'Invalid access token, does not contain scopes:[user:read:user]',
      },
    }));
    await expect(run()).resolves.toBeUndefined();
  });

  test('401 -> undefined, no throw', async () => {
    stubFetch(() => ({
      status: 401,
      body: { code: 124, message: 'Invalid access token.' },
    }));
    await expect(run()).resolves.toBeUndefined();
  });

  test('500 -> undefined, no throw', async () => {
    stubFetch(() => ({ status: 500, body: { message: 'boom' } }));
    await expect(run()).resolves.toBeUndefined();
  });

  test('network error -> undefined, no throw', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );
    await expect(run()).resolves.toBeUndefined();
  });

  test('null body -> undefined, no throw', async () => {
    stubFetch(() => ({ status: 200, body: null }));
    await expect(run()).resolves.toBeUndefined();
  });
});

type ZoomOAuthValue = Parameters<
  NonNullable<(typeof zoomAuth)['getConnectionIdentifier']>
>[0]['auth'];

type FetchRequest = { url: string; method: string };

type FakeResponse = { status: number; body: unknown };

type Seen = {
  url: string;
  method: string;
  auth: string | null;
  headers: Headers;
  body: string | null;
};
