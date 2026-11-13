import { afterEach, describe, expect, test, vi } from 'vitest';
import { freeAgentAuth } from '../src/lib/auth';

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

function oauth(extra: Partial<FreeAgentOAuthValue> = {}): FreeAgentOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function identify(auth: FreeAgentOAuthValue = oauth()) {
  const hook = freeAgentAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('freeAgentAuth has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('free-agent getConnectionIdentifier', () => {
  test('happy path: user.email from GET /v2/users/me with the bearer token', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        user: {
          url: 'https://api.freeagent.com/v2/users/1',
          first_name: 'My',
          last_name: 'User',
          email: 'me@example.com',
        },
      },
    }));
    expect(await identify()).toBe('me@example.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.freeagent.com/v2/users/me');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
    expect(seen[0].headers.get('accept')).toBe('application/json');
  });

  test('token data carries no identity on FreeAgent: the call is still made', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { user: { email: 'me@example.com' } },
    }));
    expect(
      await identify(oauth({ data: { refresh_token_expires_in: 631151957 } }))
    ).toBe('me@example.com');
    expect(seen).toHaveLength(1);
  });

  test('empty email falls back to "first last"', async () => {
    stubFetch(() => ({
      status: 200,
      body: { user: { email: '', first_name: 'My', last_name: 'User' } },
    }));
    expect(await identify()).toBe('My User');
  });

  test('missing email with only first_name returns first_name alone', async () => {
    stubFetch(() => ({
      status: 200,
      body: { user: { first_name: 'My', last_name: '' } },
    }));
    expect(await identify()).toBe('My');
  });

  test('missing email with only last_name returns last_name alone', async () => {
    stubFetch(() => ({ status: 200, body: { user: { last_name: 'User' } } }));
    expect(await identify()).toBe('User');
  });

  test('all fields empty returns undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: { user: { email: '', first_name: '', last_name: '' } },
    }));
    expect(await identify()).toBeUndefined();
  });

  test('body without user returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: {} }));
    expect(await identify()).toBeUndefined();
  });

  test('HTTP 401 returns undefined without throwing', async () => {
    stubFetch(() => ({
      status: 401,
      body: { errors: { error: { message: 'Access token not recognised' } } },
    }));
    await expect(identify()).resolves.toBeUndefined();
  });

  test('HTTP 500 returns undefined without throwing', async () => {
    stubFetch(() => ({ status: 500, body: {} }));
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

type FreeAgentOAuthValue = Parameters<
  NonNullable<(typeof freeAgentAuth)['getConnectionIdentifier']>
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
