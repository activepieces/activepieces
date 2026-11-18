import { PropertyType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { digitalOceanAuth } from '../src/lib/common/auth';

const server = {
  apiUrl: 'http://localhost:3000/api/',
  publicUrl: 'http://localhost:4200/',
};

const ACCOUNT_URL = 'https://api.digitalocean.com/v2/account';

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

function oauth(
  extra: Partial<DigitalOceanOAuthValue> = {}
): DigitalOceanOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function identifyWithOAuth(auth: DigitalOceanOAuthValue = oauth()) {
  const variant = digitalOceanAuth[0];
  if (variant.type !== PropertyType.OAUTH2) {
    throw new Error('digitalOceanAuth[0] is not the OAuth2 auth');
  }
  const hook = variant.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('digitalOceanAuth[0] has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

async function identifyWithPat(token: string) {
  const variant = digitalOceanAuth[1];
  if (variant.type !== PropertyType.SECRET_TEXT) {
    throw new Error(
      'digitalOceanAuth[1] is not the Personal Access Token auth'
    );
  }
  const hook = variant.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('digitalOceanAuth[1] has no getConnectionIdentifier hook');
  }
  return hook({ auth: token, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('digital-ocean OAuth2 getConnectionIdentifier', () => {
  test('token data: info.email from the token response, zero network calls', async () => {
    const seen = stubFetch(() => ({ status: 500, body: {} }));
    const id = await identifyWithOAuth(
      oauth({
        data: {
          info: {
            name: 'Sammy',
            email: 'sammy@do.com',
            uuid: 'u1',
            team_uuid: 't1',
            team_name: 'My Team',
          },
        },
      })
    );
    expect(id).toBe('sammy@do.com');
    expect(seen).toHaveLength(0);
  });

  test('token data: info.name when info.email is empty, zero network calls', async () => {
    const seen = stubFetch(() => ({ status: 500, body: {} }));
    expect(
      await identifyWithOAuth(
        oauth({
          data: { info: { email: '', name: 'Sammy', team_name: 'My Team' } },
        })
      )
    ).toBe('Sammy');
    expect(seen).toHaveLength(0);
  });

  test('token data: info.team_name when email and name are empty, zero network calls', async () => {
    const seen = stubFetch(() => ({ status: 500, body: {} }));
    expect(
      await identifyWithOAuth(
        oauth({ data: { info: { email: '', name: '', team_name: 'My Team' } } })
      )
    ).toBe('My Team');
    expect(seen).toHaveLength(0);
  });

  test('no info in token data: GET /v2/account with the bearer token returns account.email', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        account: {
          email: 'sammy@do.com',
          name: 'Sammy',
          team: { name: 'My Team' },
        },
      },
    }));
    expect(await identifyWithOAuth()).toBe('sammy@do.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe(ACCOUNT_URL);
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('info with all-empty fields falls through to the network call', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { account: { email: 'sammy@do.com' } },
    }));
    expect(
      await identifyWithOAuth(
        oauth({ data: { info: { email: '', name: '', team_name: '' } } })
      )
    ).toBe('sammy@do.com');
    expect(seen).toHaveLength(1);
  });

  test('network: empty account.email falls back to account.name', async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        account: { email: '', name: 'Sammy', team: { name: 'My Team' } },
      },
    }));
    expect(await identifyWithOAuth()).toBe('Sammy');
  });

  test('network: empty email and name fall back to account.team.name', async () => {
    stubFetch(() => ({
      status: 200,
      body: { account: { email: '', name: '', team: { name: 'My Team' } } },
    }));
    expect(await identifyWithOAuth()).toBe('My Team');
  });

  test('network: all fields empty returns undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: { account: { email: '', name: '', team: { name: '' } } },
    }));
    expect(await identifyWithOAuth()).toBeUndefined();
  });

  test('network: body without account returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: {} }));
    expect(await identifyWithOAuth()).toBeUndefined();
  });

  test('HTTP 401 returns undefined without throwing', async () => {
    stubFetch(() => ({
      status: 401,
      body: { id: 'unauthorized', message: 'Unable to authenticate you.' },
    }));
    await expect(identifyWithOAuth()).resolves.toBeUndefined();
  });

  test('HTTP 403 for a token missing account:read returns undefined without throwing', async () => {
    stubFetch(() => ({
      status: 403,
      body: {
        id: 'forbidden',
        message: 'You are not authorized to perform this operation',
      },
    }));
    await expect(identifyWithOAuth()).resolves.toBeUndefined();
  });

  test('HTTP 500 returns undefined without throwing', async () => {
    stubFetch(() => ({ status: 500, body: { id: 'server_error' } }));
    await expect(identifyWithOAuth()).resolves.toBeUndefined();
  });

  test('network error returns undefined without throwing', async () => {
    stubNetworkError();
    await expect(identifyWithOAuth()).resolves.toBeUndefined();
  });
});

describe('digital-ocean Personal Access Token getConnectionIdentifier', () => {
  test('GET /v2/account sends the PAT in the bearer header and returns account.email', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { account: { email: 'sammy@do.com', name: 'Sammy' } },
    }));
    expect(await identifyWithPat('dop_v1_PAT')).toBe('sammy@do.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe(ACCOUNT_URL);
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer dop_v1_PAT');
  });

  test('empty email and name fall back to team.name', async () => {
    stubFetch(() => ({
      status: 200,
      body: { account: { email: '', name: '', team: { name: 'My Team' } } },
    }));
    expect(await identifyWithPat('dop_v1_PAT')).toBe('My Team');
  });

  test('HTTP 403 from a scoped PAT without account:read returns undefined without throwing', async () => {
    stubFetch(() => ({ status: 403, body: { id: 'forbidden' } }));
    await expect(identifyWithPat('dop_v1_PAT')).resolves.toBeUndefined();
  });

  test('network error returns undefined without throwing', async () => {
    stubNetworkError();
    await expect(identifyWithPat('dop_v1_PAT')).resolves.toBeUndefined();
  });
});

type DigitalOceanOAuthValue = Parameters<
  NonNullable<
    Extract<
      (typeof digitalOceanAuth)[number],
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
