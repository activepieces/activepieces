import { afterEach, describe, expect, test, vi } from 'vitest';
import { pipedriveAuth } from '../src/lib/auth';

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

function oauth(extra: Partial<PipedriveOAuthValue> = {}): PipedriveOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

function withDomain(
  data: Record<string, unknown> = { api_domain: 'https://acme.pipedrive.com' }
): PipedriveOAuthValue {
  return oauth({ data });
}

async function identify(auth: PipedriveOAuthValue = withDomain()) {
  const hook = pipedriveAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('pipedriveAuth has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('pipedrive getConnectionIdentifier', () => {
  test('happy path: GET {api_domain}/api/v1/users/me returns data.email', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        success: true,
        data: {
          id: 1,
          name: 'Pat Doe',
          email: 'pat@acme.com',
          company_name: 'Acme',
        },
      },
    }));
    expect(await identify()).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://acme.pipedrive.com/api/v1/users/me');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('empty email falls back to name', async () => {
    stubFetch(() => ({
      status: 200,
      body: { success: true, data: { name: 'Pat Doe', email: '' } },
    }));
    expect(await identify()).toBe('Pat Doe');
  });

  test('missing email falls back to name', async () => {
    stubFetch(() => ({
      status: 200,
      body: { success: true, data: { name: 'Pat Doe' } },
    }));
    expect(await identify()).toBe('Pat Doe');
  });

  test('empty email and name returns undefined, never empty string', async () => {
    stubFetch(() => ({
      status: 200,
      body: { success: true, data: { name: '', email: '' } },
    }));
    expect(await identify()).toBeUndefined();
  });

  test('missing data envelope returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: { success: true } }));
    expect(await identify()).toBeUndefined();
  });

  test('null body returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: null }));
    expect(await identify()).toBeUndefined();
  });

  test.each([
    { label: 'missing', data: {} },
    { label: 'empty', data: { api_domain: '' } },
    { label: 'non-string', data: { api_domain: 42 } },
  ])(
    '$label api_domain falls back to https://api.pipedrive.com like the custom API call action',
    async ({ data }) => {
      const seen = stubFetch(() => ({
        status: 200,
        body: { success: true, data: { email: 'pat@acme.com' } },
      }));
      expect(await identify(withDomain(data))).toBe('pat@acme.com');
      expect(seen[0].url).toBe('https://api.pipedrive.com/api/v1/users/me');
    }
  );

  test.each([401, 403, 500])(
    'HTTP %i returns undefined without throwing',
    async (status) => {
      stubFetch(() => ({ status, body: { success: false, error: 'nope' } }));
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

type PipedriveOAuthValue = Parameters<
  NonNullable<(typeof pipedriveAuth)['getConnectionIdentifier']>
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
