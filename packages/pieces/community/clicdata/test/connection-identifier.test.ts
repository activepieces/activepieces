import { PropertyType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { clicdataAuth } from '../src/lib/common/auth';

const server = {
  apiUrl: 'http://localhost:3000/api/',
  publicUrl: 'http://localhost:4200/',
};

const ACCOUNT_URL = 'https://api.clicdata.com/account?api_version=2022.01';

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

function stubNetworkError(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new TypeError('fetch failed');
    })
  );
}

function oauth(extra: Partial<ClicdataOAuthValue> = {}): ClicdataOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

function withoutKey<T extends object>({
  value,
  key,
}: {
  value: T;
  key: keyof T;
}): T {
  const copy = { ...value };
  Reflect.deleteProperty(copy, key);
  return copy;
}

async function identifyWithOAuth(auth: ClicdataOAuthValue = oauth()) {
  const variant = clicdataAuth[0];
  if (variant.type !== PropertyType.OAUTH2) {
    throw new Error('clicdataAuth[0] is not the OAuth2 auth');
  }
  const hook = variant.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('clicdataAuth[0] has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

async function identifyWithApiKey(key: string) {
  const variant = clicdataAuth[1];
  if (variant.type !== PropertyType.SECRET_TEXT) {
    throw new Error('clicdataAuth[1] is not the API key auth');
  }
  const hook = variant.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('clicdataAuth[1] has no getConnectionIdentifier hook');
  }
  return hook({ auth: key, server });
}

async function identifyWithBasic(auth: ClicdataBasicValue) {
  const variant = clicdataAuth[2];
  if (variant.type !== PropertyType.CUSTOM_AUTH) {
    throw new Error('clicdataAuth[2] is not the Basic auth');
  }
  const hook = variant.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('clicdataAuth[2] has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('clicdata OAuth2 getConnectionIdentifier', () => {
  test('happy path: result.name from GET /account with the bearer token', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        success: true,
        result: { id: 1, name: 'My Account', domain: 'myaccount' },
      },
    }));
    expect(await identifyWithOAuth()).toBe('My Account');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe(ACCOUNT_URL);
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('token data carries no identity on ClicData: the call is still made', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { success: true, result: { name: 'My Account' } },
    }));
    expect(
      await identifyWithOAuth(
        oauth({ data: { grant_type: 'client_credentials' } })
      )
    ).toBe('My Account');
    expect(seen).toHaveLength(1);
  });

  test('empty result.name falls back to result.domain', async () => {
    stubFetch(() => ({
      status: 200,
      body: { success: true, result: { id: 1, name: '', domain: 'myaccount' } },
    }));
    expect(await identifyWithOAuth()).toBe('myaccount');
  });

  test('empty name and domain returns undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: { success: true, result: { id: 1, name: '', domain: '' } },
    }));
    expect(await identifyWithOAuth()).toBeUndefined();
  });

  test('success:false body with HTTP 200 returns undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        success: false,
        error: { code: 'unauthorized', description: 'Missing scope' },
      },
    }));
    expect(await identifyWithOAuth()).toBeUndefined();
  });

  test('HTTP 401 returns undefined without throwing', async () => {
    stubFetch(() => ({
      status: 401,
      body: {
        success: false,
        error: { code: '401', description: 'Unauthorized' },
      },
    }));
    await expect(identifyWithOAuth()).resolves.toBeUndefined();
  });

  test('HTTP 500 returns undefined without throwing', async () => {
    stubFetch(() => ({ status: 500, body: {} }));
    await expect(identifyWithOAuth()).resolves.toBeUndefined();
  });

  test('network error returns undefined without throwing', async () => {
    stubNetworkError();
    await expect(identifyWithOAuth()).resolves.toBeUndefined();
  });
});

describe('clicdata API key getConnectionIdentifier', () => {
  test('GET /account with the CLICDATA-API-KEY header and no Authorization header', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { success: true, result: { name: 'My Account' } },
    }));
    expect(await identifyWithApiKey('KEY123')).toBe('My Account');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe(ACCOUNT_URL);
    expect(seen[0].method).toBe('GET');
    expect(seen[0].headers.get('clicdata-api-key')).toBe('KEY123');
    expect(seen[0].auth).toBeNull();
  });

  test('HTTP 401 returns undefined without throwing', async () => {
    stubFetch(() => ({ status: 401, body: {} }));
    await expect(identifyWithApiKey('KEY123')).resolves.toBeUndefined();
  });
});

describe('clicdata Basic auth getConnectionIdentifier', () => {
  test('returns the typed userEmail, trimmed, with zero network calls', async () => {
    const seen = stubFetch(() => ({ status: 500, body: {} }));
    expect(
      await identifyWithBasic({
        clientId: 'c1',
        userEmail: '  pat@acme.com ',
        userPassword: 'pw',
      })
    ).toBe('pat@acme.com');
    expect(seen).toHaveLength(0);
  });

  test('blank userEmail returns undefined', async () => {
    expect(
      await identifyWithBasic({
        clientId: 'c1',
        userEmail: '   ',
        userPassword: 'pw',
      })
    ).toBeUndefined();
  });

  test('missing userEmail returns undefined without throwing', async () => {
    const auth = withoutKey({
      value: { clientId: 'c1', userEmail: 'unused', userPassword: 'pw' },
      key: 'userEmail',
    });
    await expect(identifyWithBasic(auth)).resolves.toBeUndefined();
  });
});

type ClicdataOAuthValue = Parameters<
  NonNullable<
    Extract<
      (typeof clicdataAuth)[number],
      { type: PropertyType.OAUTH2 }
    >['getConnectionIdentifier']
  >
>[0]['auth'];

type ClicdataBasicValue = Parameters<
  NonNullable<
    Extract<
      (typeof clicdataAuth)[number],
      { type: PropertyType.CUSTOM_AUTH }
    >['getConnectionIdentifier']
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
