import { afterEach, describe, expect, test, vi } from 'vitest';
import { ringcentralAuth } from './auth';

const server = {
  apiUrl: 'http://localhost:3000/api/',
  publicUrl: 'http://localhost:4200/',
};

const EXT_PATH = '/restapi/v1.0/account/~/extension/~';

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
  extra: Partial<RingcentralOAuthValue> = {}
): RingcentralOAuthValue {
  return { access_token: 'TKN', data: {}, ...extra };
}

async function run(extra: Partial<RingcentralOAuthValue> = {}) {
  const hook = ringcentralAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('ringcentralAuth has no getConnectionIdentifier hook');
  }
  return hook({
    auth: oauth({
      props: { environment: 'platform.ringcentral.com' },
      ...extra,
    }),
    server,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ringcentral getConnectionIdentifier', () => {
  test('happy path (production): contact.email from GET extension/~ with the bearer token', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        id: 101,
        name: 'Pat Lee',
        extensionNumber: '101',
        contact: { firstName: 'Pat', lastName: 'Lee', email: 'pat@acme.com' },
      },
    }));
    expect(await run()).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe(`https://platform.ringcentral.com${EXT_PATH}`);
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('sandbox environment prop -> devtest host', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { contact: { email: 'pat@acme.com' } },
    }));
    expect(
      await run({ props: { environment: 'platform.devtest.ringcentral.com' } })
    ).toBe('pat@acme.com');
    expect(seen[0].url).toBe(
      `https://platform.devtest.ringcentral.com${EXT_PATH}`
    );
  });

  test('no environment prop -> production host (same default as the piece client)', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { contact: { email: 'pat@acme.com' } },
    }));
    expect(await run({ props: undefined })).toBe('pat@acme.com');
    expect(seen[0].url).toBe(`https://platform.ringcentral.com${EXT_PATH}`);
  });

  test('token data carries no identity on RingCentral: the call is still made', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { contact: { email: 'pat@acme.com' } },
    }));
    expect(
      await run({
        data: {
          owner_id: '101',
          endpoint_id: 'e1',
          refresh_token_expires_in: 604800,
        },
      })
    ).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
  });

  test('contact.email empty -> extension name', async () => {
    stubFetch(() => ({
      status: 200,
      body: { name: 'Pat Lee', contact: { email: '' } },
    }));
    expect(await run()).toBe('Pat Lee');
  });

  test('no contact object -> extension name', async () => {
    stubFetch(() => ({ status: 200, body: { name: 'Pat Lee' } }));
    expect(await run()).toBe('Pat Lee');
  });

  test('email and name both empty -> undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: { name: '', contact: { email: '' } },
    }));
    expect(await run()).toBeUndefined();
  });

  test('401 -> undefined, no throw', async () => {
    stubFetch(() => ({
      status: 401,
      body: { errorCode: 'TokenInvalid', message: 'Token not found' },
    }));
    await expect(run()).resolves.toBeUndefined();
  });

  test('403 app lacks ReadAccounts -> undefined, no throw', async () => {
    stubFetch(() => ({
      status: 403,
      body: {
        errorCode: 'CMN-401',
        message: '[ReadAccounts] permission required',
      },
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

type RingcentralOAuthValue = Parameters<
  NonNullable<(typeof ringcentralAuth)['getConnectionIdentifier']>
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
