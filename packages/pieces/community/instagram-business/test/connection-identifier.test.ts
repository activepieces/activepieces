import { afterEach, describe, expect, test, vi } from 'vitest';
import { instagramCommon } from '../src/lib/common';

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

function oauth(extra: Partial<InstagramOAuthValue> = {}): InstagramOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function identify(auth: InstagramOAuthValue = oauth()) {
  const hook = instagramCommon.authentication.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error(
      'instagramCommon.authentication has no getConnectionIdentifier hook'
    );
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('instagram-business getConnectionIdentifier', () => {
  test('happy path: name from GET graph.facebook.com/v23.0/me?fields=name with the bearer token', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { name: 'Pat Lee', id: '1234567890' },
    }));
    expect(await identify()).toBe('Pat Lee');
    expect(seen).toHaveLength(1);
    const url = new URL(seen[0].url);
    expect(`${url.origin}${url.pathname}`).toBe(
      'https://graph.facebook.com/v23.0/me'
    );
    expect(url.searchParams.get('fields')).toBe('name');
    expect([...url.searchParams.keys()]).toEqual(['fields']);
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('access token is not leaked into the query string', async () => {
    const seen = stubFetch(() => ({ status: 200, body: { name: 'Pat Lee' } }));
    await identify();
    expect(seen[0].url).not.toContain('TKN');
  });

  test('missing name returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: { id: '1234567890' } }));
    expect(await identify()).toBeUndefined();
  });

  test('empty name returns undefined, never empty string', async () => {
    stubFetch(() => ({ status: 200, body: { id: '1234567890', name: '' } }));
    expect(await identify()).toBeUndefined();
  });

  test('Graph OAuthException 400 returns undefined without throwing', async () => {
    stubFetch(() => ({
      status: 400,
      body: {
        error: {
          message: 'Error validating access token',
          type: 'OAuthException',
          code: 190,
        },
      },
    }));
    await expect(identify()).resolves.toBeUndefined();
  });

  test('HTTP 401 returns undefined without throwing', async () => {
    stubFetch(() => ({ status: 401, body: { error: { code: 190 } } }));
    await expect(identify()).resolves.toBeUndefined();
  });

  test('HTTP 500 returns undefined without throwing', async () => {
    stubFetch(() => ({ status: 500, body: { error: { code: 2 } } }));
    await expect(identify()).resolves.toBeUndefined();
  });

  test('network error returns undefined without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );
    await expect(identify()).resolves.toBeUndefined();
  });
});

type InstagramOAuthValue = Parameters<
  NonNullable<
    (typeof instagramCommon)['authentication']['getConnectionIdentifier']
  >
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
