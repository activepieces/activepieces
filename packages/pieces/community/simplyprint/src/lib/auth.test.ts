import { afterEach, describe, expect, test, vi } from 'vitest';
import { simplyprintAuth } from './auth';

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

function oauth(
  extra: Partial<SimplyprintOAuthValue> = {}
): SimplyprintOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function run(extra: Partial<SimplyprintOAuthValue> = {}) {
  const hook = simplyprintAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('simplyprintAuth has no getConnectionIdentifier hook');
  }
  return hook({ auth: oauth(extra), server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('simplyprint getConnectionIdentifier', () => {
  test('happy path: user.email from GET /api/0/account/GetUser with the bearer token', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        status: true,
        message: null,
        user: { id: 112, name: 'John Doe', email: 'john@doe.com' },
        company: { id: 123, name: 'My Company' },
      },
    }));
    expect(await run()).toBe('john@doe.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://simplyprint.io/api/0/account/GetUser');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('token data carries no identity on SimplyPrint: the call is still made', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { status: true, user: { email: 'john@doe.com' } },
    }));
    expect(await run({ data: {} })).toBe('john@doe.com');
    expect(seen).toHaveLength(1);
  });

  test('user.email empty -> user.name', async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        status: true,
        user: { id: 112, name: 'John Doe', email: '' },
        company: { id: 123, name: 'My Company' },
      },
    }));
    expect(await run()).toBe('John Doe');
  });

  test('no user object -> company.name', async () => {
    stubFetch(() => ({
      status: 200,
      body: { status: true, company: { id: 123, name: 'My Company' } },
    }));
    expect(await run()).toBe('My Company');
  });

  test('all empty -> undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        status: true,
        user: { id: 112, name: '', email: '' },
        company: { id: 123, name: '' },
      },
    }));
    expect(await run()).toBeUndefined();
  });

  test('status:false body (HTTP 200) -> undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: { status: false, message: 'Invalid token' },
    }));
    expect(await run()).toBeUndefined();
  });

  test('401 -> undefined, no throw', async () => {
    stubFetch(() => ({
      status: 401,
      body: { status: false, message: 'Unauthorized' },
    }));
    await expect(run()).resolves.toBeUndefined();
  });

  test('500 -> undefined, no throw', async () => {
    stubFetch(() => ({ status: 500, body: {} }));
    await expect(run()).resolves.toBeUndefined();
  });

  test('network error -> undefined, no throw', async () => {
    stubFetch(() => {
      throw new TypeError('fetch failed');
    });
    await expect(run()).resolves.toBeUndefined();
  });
});

type SimplyprintOAuthValue = Parameters<
  NonNullable<(typeof simplyprintAuth)['getConnectionIdentifier']>
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
