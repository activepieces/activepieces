import { PropertyType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { intercomAuth, intercomOAuth2Auth } from '../src/lib/auth';

const server = {
  apiUrl: 'http://localhost:3000/api/',
  publicUrl: 'http://localhost:4200/',
};

const admin = {
  type: 'admin',
  id: '1',
  email: 'pat@acme.com',
  name: 'Pat Lee',
  email_verified: true,
  app: { type: 'app', id_code: 'abc', name: 'Acme Support' },
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

function oauth(extra: Partial<IntercomOAuthValue> = {}): IntercomOAuthValue {
  return {
    access_token: 'TKN',
    data: {},
    props: { region: 'intercom' },
    ...extra,
  };
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

async function identifyWithOAuth(auth: IntercomOAuthValue = oauth()) {
  const hook = intercomOAuth2Auth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('intercomOAuth2Auth has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

async function identifyWithCustom(region: string) {
  const variant = intercomAuth[1];
  if (variant.type !== PropertyType.CUSTOM_AUTH) {
    throw new Error('intercomAuth[1] is not the access token auth');
  }
  const hook = variant.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('intercomAuth[1] has no getConnectionIdentifier hook');
  }
  return hook({ auth: { accessToken: 'ACC', region }, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('intercom getConnectionIdentifier', () => {
  test('variant order is [OAUTH2, CUSTOM_AUTH] and both declare the hook', () => {
    expect(intercomAuth[0]).toBe(intercomOAuth2Auth);
    expect(typeof intercomOAuth2Auth.getConnectionIdentifier).toBe('function');
    expect(intercomAuth[1].type).toBe(PropertyType.CUSTOM_AUTH);
    expect(typeof intercomAuth[1].getConnectionIdentifier).toBe('function');
  });

  test('oauth US: admin email from api.intercom.io/me with the bearer token', async () => {
    const seen = stubFetch(() => ({ status: 200, body: admin }));
    expect(await identifyWithOAuth()).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.intercom.io/me');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('oauth EU: region prop builds api.eu.intercom.io', async () => {
    const seen = stubFetch(() => ({ status: 200, body: admin }));
    expect(
      await identifyWithOAuth(oauth({ props: { region: 'eu.intercom' } }))
    ).toBe('pat@acme.com');
    expect(seen[0].url).toBe('https://api.eu.intercom.io/me');
  });

  test.each([
    [
      'props without region',
      oauth({
        props: withoutKey({ value: { region: 'unused' }, key: 'region' }),
      }),
    ],
    ['no props at all', oauth({ props: undefined })],
  ])('oauth %s defaults to the US host', async (_name, auth) => {
    const seen = stubFetch(() => ({ status: 200, body: admin }));
    expect(await identifyWithOAuth(auth)).toBe('pat@acme.com');
    expect(seen[0].url).toBe('https://api.intercom.io/me');
  });

  test('custom auth AU: region builds api.au.intercom.io with the access token', async () => {
    const seen = stubFetch(() => ({ status: 200, body: admin }));
    expect(await identifyWithCustom('au.intercom')).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.au.intercom.io/me');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer ACC');
  });

  test('empty email falls back to admin name', async () => {
    stubFetch(() => ({ status: 200, body: { ...admin, email: '' } }));
    expect(await identifyWithOAuth()).toBe('Pat Lee');
  });

  test('empty email and name fall back to app name', async () => {
    stubFetch(() => ({ status: 200, body: { ...admin, email: '', name: '' } }));
    expect(await identifyWithCustom('intercom')).toBe('Acme Support');
  });

  test('no usable fields returns undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: { type: 'admin', id: '1', email: '', app: {} },
    }));
    expect(await identifyWithOAuth()).toBeUndefined();
  });

  test.each([401, 403, 500])(
    'oauth: HTTP %i returns undefined without throwing',
    async (status) => {
      stubFetch(() => ({
        status,
        body: { type: 'error.list', errors: [{ code: 'unauthorized' }] },
      }));
      await expect(identifyWithOAuth()).resolves.toBeUndefined();
    }
  );

  test.each([401, 500])(
    'custom auth: HTTP %i returns undefined without throwing',
    async (status) => {
      stubFetch(() => ({ status, body: { type: 'error.list' } }));
      await expect(identifyWithCustom('eu.intercom')).resolves.toBeUndefined();
    }
  );

  test('network error returns undefined without throwing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );
    await expect(identifyWithOAuth()).resolves.toBeUndefined();
    await expect(identifyWithCustom('intercom')).resolves.toBeUndefined();
  });
});

type IntercomOAuthValue = Parameters<
  NonNullable<(typeof intercomOAuth2Auth)['getConnectionIdentifier']>
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
