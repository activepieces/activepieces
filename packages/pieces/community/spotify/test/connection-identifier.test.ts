import { afterEach, describe, expect, test, vi } from 'vitest';
import { spotifyCommon } from '../src/lib/common';

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

function oauth(extra: Partial<SpotifyOAuthValue> = {}): SpotifyOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function run(auth: SpotifyOAuthValue = oauth()) {
  const hook = spotifyCommon.authentication.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error(
      'spotifyCommon.authentication has no getConnectionIdentifier hook'
    );
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('spotify getConnectionIdentifier', () => {
  test('happy path: email from GET /v1/me with the bearer token (only when user-read-email was granted)', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { id: 'wizzler', email: 'pat@acme.com', display_name: 'Pat Lee' },
    }));
    expect(await run()).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.spotify.com/v1/me');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('current scopes: no email field -> display_name', async () => {
    stubFetch(() => ({
      status: 200,
      body: { id: 'wizzler', display_name: 'Pat Lee', type: 'user' },
    }));
    expect(await run()).toBe('Pat Lee');
  });

  test('empty email -> display_name', async () => {
    stubFetch(() => ({
      status: 200,
      body: { id: 'wizzler', email: '', display_name: 'Pat Lee' },
    }));
    expect(await run()).toBe('Pat Lee');
  });

  test('null display_name -> id', async () => {
    stubFetch(() => ({
      status: 200,
      body: { id: 'wizzler', display_name: null },
    }));
    expect(await run()).toBe('wizzler');
  });

  test('empty display_name -> id', async () => {
    stubFetch(() => ({
      status: 200,
      body: { id: 'wizzler', display_name: '' },
    }));
    expect(await run()).toBe('wizzler');
  });

  test('nothing usable -> undefined', async () => {
    stubFetch(() => ({ status: 200, body: { id: '', display_name: null } }));
    expect(await run()).toBeUndefined();
  });

  test('401 -> undefined, no throw', async () => {
    stubFetch(() => ({
      status: 401,
      body: { error: { status: 401, message: 'Invalid access token' } },
    }));
    await expect(run()).resolves.toBeUndefined();
  });

  test('403 (app in development mode, user not allowlisted) -> undefined, no throw', async () => {
    stubFetch(() => ({
      status: 403,
      body: {
        error: {
          status: 403,
          message: 'User not registered in the Developer Dashboard',
        },
      },
    }));
    await expect(run()).resolves.toBeUndefined();
  });

  test('500 -> undefined, no throw', async () => {
    stubFetch(() => ({ status: 500, body: { error: { status: 500 } } }));
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
});

type SpotifyOAuthValue = Parameters<
  NonNullable<
    (typeof spotifyCommon)['authentication']['getConnectionIdentifier']
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
