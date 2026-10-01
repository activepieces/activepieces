import { afterEach, describe, expect, test, vi } from 'vitest';
import {
  githubAppAuth,
  githubOAuth2Auth,
  githubPatAuth,
} from '../src/lib/auth';

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

function oauth(extra: Partial<GithubOAuthValue> = {}): GithubOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function identify(auth: GithubOAuthValue = oauth()) {
  const hook = githubOAuth2Auth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('githubOAuth2Auth has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('github getConnectionIdentifier', () => {
  test('happy path: GET /user returns the public email', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { login: 'octocat', email: 'octo@github.com', name: 'The Octocat' },
    }));
    expect(await identify()).toBe('octo@github.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.github.com/user');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
    expect(seen[0].headers.get('accept')).toBe('application/vnd.github+json');
    expect(seen[0].headers.get('x-github-api-version')).toBe('2022-11-28');
  });

  test('null public email falls back to login', async () => {
    stubFetch(() => ({
      status: 200,
      body: { login: 'octocat', email: null, name: 'The Octocat' },
    }));
    expect(await identify()).toBe('octocat');
  });

  test('empty public email falls back to login', async () => {
    stubFetch(() => ({ status: 200, body: { login: 'octocat', email: '' } }));
    expect(await identify()).toBe('octocat');
  });

  test('missing email field falls back to login', async () => {
    stubFetch(() => ({ status: 200, body: { login: 'octocat' } }));
    expect(await identify()).toBe('octocat');
  });

  test('no email and empty login returns undefined, never empty string', async () => {
    stubFetch(() => ({ status: 200, body: { login: '', email: null } }));
    expect(await identify()).toBeUndefined();
  });

  test('empty body returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: {} }));
    expect(await identify()).toBeUndefined();
  });

  test('null body returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: null }));
    expect(await identify()).toBeUndefined();
  });

  test('does not call /user/emails (piece lacks user:email scope)', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { login: 'octocat', email: null },
    }));
    await identify();
    expect(seen.map((s) => s.url)).toEqual(['https://api.github.com/user']);
  });

  test.each([401, 403, 500])(
    'HTTP %i returns undefined without throwing',
    async (status) => {
      stubFetch(() => ({ status, body: { message: 'nope' } }));
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

  test('only the OAuth2 auth carries the hook', () => {
    expect(typeof githubOAuth2Auth.getConnectionIdentifier).toBe('function');
    expect(githubPatAuth.getConnectionIdentifier).toBeUndefined();
    expect(githubAppAuth.getConnectionIdentifier).toBeUndefined();
  });
});

type GithubOAuthValue = Parameters<
  NonNullable<(typeof githubOAuth2Auth)['getConnectionIdentifier']>
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
