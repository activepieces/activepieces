import { afterEach, describe, expect, test, vi } from 'vitest';
import { pinterestAuth } from '../src/lib/common/auth';

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

function oauth(extra: Partial<PinterestOAuthValue> = {}): PinterestOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function identify(auth: PinterestOAuthValue = oauth()) {
  const hook = pinterestAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('pinterestAuth has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pinterest getConnectionIdentifier', () => {
  test('happy path: username from v5/user_account with the bearer token', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        username: 'acme_shop',
        business_name: 'Acme Shop',
        account_type: 'BUSINESS',
      },
    }));
    expect(await identify()).toBe('acme_shop');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.pinterest.com/v5/user_account');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('token data carries no identity, so the call is always made', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { username: 'acme_shop' },
    }));
    expect(
      await identify(
        oauth({
          data: {
            access_token: 'TKN',
            scope: 'user_accounts:read',
            token_type: 'bearer',
          },
        })
      )
    ).toBe('acme_shop');
    expect(seen).toHaveLength(1);
  });

  test('empty username falls back to business_name', async () => {
    stubFetch(() => ({
      status: 200,
      body: { username: '', business_name: 'Acme Shop' },
    }));
    expect(await identify()).toBe('Acme Shop');
  });

  test('missing username and null business_name returns undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: { business_name: null, account_type: 'PINNER' },
    }));
    expect(await identify()).toBeUndefined();
  });

  test.each([401, 403, 500])(
    'HTTP %i returns undefined without throwing',
    async (status) => {
      stubFetch(() => ({ status, body: { code: 2, message: 'nope' } }));
      await expect(identify()).resolves.toBeUndefined();
    }
  );

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

type PinterestOAuthValue = Parameters<
  NonNullable<(typeof pinterestAuth)['getConnectionIdentifier']>
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
