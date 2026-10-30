import { afterEach, describe, expect, test, vi } from 'vitest';
import { podioAuth } from '../src/lib/auth';

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

function oauth(extra: Partial<PodioOAuthValue> = {}): PodioOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function identify(
  auth: PodioOAuthValue = oauth({ data: { ref: { type: 'user', id: 99 } } })
) {
  const hook = podioAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('podioAuth has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('podio getConnectionIdentifier', () => {
  test('happy path: GET /user/status returns user.mail', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        user: { user_id: 99, mail: 'pat@example.com' },
        profile: { profile_id: 7, name: 'Pat Doe', mail: ['pat@example.com'] },
      },
    }));
    expect(await identify()).toBe('pat@example.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.podio.com/user/status');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('empty user.mail falls back to profile.name', async () => {
    stubFetch(() => ({
      status: 200,
      body: { user: { user_id: 99, mail: '' }, profile: { name: 'Pat Doe' } },
    }));
    expect(await identify()).toBe('Pat Doe');
  });

  test('missing user object falls back to profile.name', async () => {
    stubFetch(() => ({ status: 200, body: { profile: { name: 'Pat Doe' } } }));
    expect(await identify()).toBe('Pat Doe');
  });

  test('empty mail and empty name returns undefined, never empty string', async () => {
    stubFetch(() => ({
      status: 200,
      body: { user: { mail: '' }, profile: { name: '' } },
    }));
    expect(await identify()).toBeUndefined();
  });

  test('missing user and profile returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: { inbox_new: 0 } }));
    expect(await identify()).toBeUndefined();
  });

  test('null body returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: null }));
    expect(await identify()).toBeUndefined();
  });

  test.each([401, 403, 420, 500])(
    'HTTP %i returns undefined without throwing',
    async (status) => {
      stubFetch(() => ({ status, body: { error: 'nope' } }));
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

type PodioOAuthValue = Parameters<
  NonNullable<(typeof podioAuth)['getConnectionIdentifier']>
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
