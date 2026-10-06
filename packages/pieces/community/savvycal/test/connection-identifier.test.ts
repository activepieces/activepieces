import { PropertyType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { savvyCalAuth } from '../src/lib/auth';

const server = {
  apiUrl: 'http://localhost:3000/api/',
  publicUrl: 'http://localhost:4200/',
};

const oauth2Auth = savvyCalAuth[0];
const patAuth = savvyCalAuth[1];

const user = {
  id: 'user_01',
  email: 'pat@acme.com',
  display_name: 'Pat Lee',
  first_name: 'Pat',
  last_name: 'Lee',
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

function oauth(extra: Partial<SavvyCalOAuthValue> = {}): SavvyCalOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function runOAuth() {
  if (oauth2Auth.type !== PropertyType.OAUTH2) {
    throw new Error('savvyCalAuth[0] is not the OAuth2 auth');
  }
  const hook = oauth2Auth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('savvyCalAuth[0] has no getConnectionIdentifier hook');
  }
  return hook({ auth: oauth(), server });
}

async function runPat() {
  if (patAuth.type !== PropertyType.CUSTOM_AUTH) {
    throw new Error('savvyCalAuth[1] is not the personal access token auth');
  }
  const hook = patAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('savvyCalAuth[1] has no getConnectionIdentifier hook');
  }
  return hook({ auth: { token: 'pt_secret_ABC' }, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('savvycal getConnectionIdentifier', () => {
  test('both auths declare the hook', () => {
    expect(typeof oauth2Auth.getConnectionIdentifier).toBe('function');
    expect(typeof patAuth.getConnectionIdentifier).toBe('function');
  });

  test('OAuth2 happy path: email from GET /v1/me with the access token', async () => {
    const seen = stubFetch(() => ({ status: 200, body: user }));
    expect(await runOAuth()).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.savvycal.com/v1/me');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('Personal Access Token happy path: same endpoint with the PAT as bearer', async () => {
    const seen = stubFetch(() => ({ status: 200, body: user }));
    expect(await runPat()).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.savvycal.com/v1/me');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer pt_secret_ABC');
  });

  test('empty email -> display_name', async () => {
    stubFetch(() => ({ status: 200, body: { ...user, email: '' } }));
    expect(await runOAuth()).toBe('Pat Lee');
  });

  test('no email, no display_name -> "first last"', async () => {
    stubFetch(() => ({
      status: 200,
      body: { id: 'user_01', first_name: 'Pat', last_name: 'Lee' },
    }));
    expect(await runPat()).toBe('Pat Lee');
  });

  test('only first_name -> first_name without a trailing space', async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        id: 'user_01',
        email: '',
        display_name: '',
        first_name: 'Pat',
        last_name: '',
      },
    }));
    expect(await runOAuth()).toBe('Pat');
  });

  test('nothing usable -> undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        id: 'user_01',
        email: '',
        display_name: '',
        first_name: '',
        last_name: '',
      },
    }));
    expect(await runOAuth()).toBeUndefined();
  });

  test('401 -> undefined, no throw (both auths)', async () => {
    stubFetch(() => ({ status: 401, body: { error: 'unauthorized' } }));
    await expect(runOAuth()).resolves.toBeUndefined();
    await expect(runPat()).resolves.toBeUndefined();
  });

  test('500 -> undefined, no throw', async () => {
    stubFetch(() => ({ status: 500, body: { error: 'boom' } }));
    await expect(runOAuth()).resolves.toBeUndefined();
  });

  test('network error -> undefined, no throw (both auths)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );
    await expect(runOAuth()).resolves.toBeUndefined();
    await expect(runPat()).resolves.toBeUndefined();
  });
});

type SavvyCalOAuthValue = Parameters<
  NonNullable<
    Extract<
      (typeof savvyCalAuth)[number],
      { type: PropertyType.OAUTH2 }
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
