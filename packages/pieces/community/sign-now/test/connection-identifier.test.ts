import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  signNowApiKeyAuth,
  signNowAuth,
  signNowOAuth2Auth,
} from '../src/lib/common/auth';

const server = {
  apiUrl: 'http://localhost:3000/api/',
  publicUrl: 'http://localhost:4200/',
};

const USER_URL = 'https://api.signnow.com/user';

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

function oauth(extra: Partial<SignNowOAuthValue> = {}): SignNowOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

function apiKeyValueWithoutKey(): SignNowApiKeyValue {
  const auth: SignNowApiKeyValue = { apiKey: '' };
  Reflect.deleteProperty(auth, 'apiKey');
  return auth;
}

async function runOAuth(extra: Partial<SignNowOAuthValue> = {}) {
  const hook = signNowOAuth2Auth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('signNowOAuth2Auth has no getConnectionIdentifier hook');
  }
  return hook({ auth: oauth(extra), server });
}

async function runApiKey(auth: SignNowApiKeyValue) {
  const hook = signNowApiKeyAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('signNowApiKeyAuth has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('sign-now OAuth2 getConnectionIdentifier', () => {
  test('both auths in the exported array carry the hook', () => {
    expect(
      signNowAuth.every(
        (auth) => typeof auth.getConnectionIdentifier === 'function'
      )
    ).toBe(true);
  });

  test('happy path: primary_email from GET /user with the bearer token', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        id: 'u1',
        first_name: 'Pat',
        last_name: 'Lee',
        emails: ['other@acme.com'],
        primary_email: 'pat@acme.com',
      },
    }));
    expect(await runOAuth()).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe(USER_URL);
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
    expect(seen[0].headers.get('accept')).toBe('application/json');
  });

  test('token data carries no identity on SignNow: the call is still made', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { primary_email: 'pat@acme.com' },
    }));
    expect(await runOAuth({ data: { last_login: 0, id: 'u1' } })).toBe(
      'pat@acme.com'
    );
    expect(seen).toHaveLength(1);
  });

  test('primary_email empty -> first non-empty entry of emails[]', async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        primary_email: '',
        emails: ['', 'pat@acme.com'],
        first_name: 'Pat',
      },
    }));
    expect(await runOAuth()).toBe('pat@acme.com');
  });

  test('no emails -> "first last"', async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        primary_email: '',
        emails: [],
        first_name: 'Pat',
        last_name: 'Lee',
      },
    }));
    expect(await runOAuth()).toBe('Pat Lee');
  });

  test('only first_name -> first_name', async () => {
    stubFetch(() => ({ status: 200, body: { first_name: 'Pat' } }));
    expect(await runOAuth()).toBe('Pat');
  });

  test('everything empty -> undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: { primary_email: '', emails: [''], first_name: '', last_name: '' },
    }));
    expect(await runOAuth()).toBeUndefined();
  });

  test('401 -> undefined, no throw', async () => {
    stubFetch(() => ({ status: 401, body: { error: 'invalid_token' } }));
    await expect(runOAuth()).resolves.toBeUndefined();
  });

  test('500 -> undefined, no throw', async () => {
    stubFetch(() => ({ status: 500, body: {} }));
    await expect(runOAuth()).resolves.toBeUndefined();
  });

  test('network error -> undefined, no throw', async () => {
    stubFetch(() => {
      throw new TypeError('fetch failed');
    });
    await expect(runOAuth()).resolves.toBeUndefined();
  });
});

describe('sign-now API key getConnectionIdentifier', () => {
  test('GET /user with the trimmed API key as bearer -> primary_email', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { primary_email: 'pat@acme.com' },
    }));
    expect(await runApiKey({ apiKey: '  KEY123  ' })).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe(USER_URL);
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer KEY123');
  });

  test('401 -> undefined, no throw', async () => {
    stubFetch(() => ({ status: 401, body: {} }));
    await expect(runApiKey({ apiKey: 'KEY123' })).resolves.toBeUndefined();
  });

  test('missing apiKey -> undefined, no throw', async () => {
    stubFetch(() => ({
      status: 200,
      body: { primary_email: 'pat@acme.com' },
    }));
    const auth = apiKeyValueWithoutKey();
    expect(auth).toEqual({});
    await expect(runApiKey(auth)).resolves.toBeUndefined();
  });
});

type SignNowOAuthValue = Parameters<
  NonNullable<(typeof signNowOAuth2Auth)['getConnectionIdentifier']>
>[0]['auth'];

type SignNowApiKeyValue = Parameters<
  NonNullable<(typeof signNowApiKeyAuth)['getConnectionIdentifier']>
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
