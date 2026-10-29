import { afterEach, describe, expect, test, vi } from 'vitest';
import { todoistAuth } from '../src';

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

function oauth(extra: Partial<TodoistOAuthValue> = {}): TodoistOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function identify(auth: TodoistOAuthValue = oauth()) {
  const hook = todoistAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('todoistAuth has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('todoist getConnectionIdentifier', () => {
  test('happy path: GET /api/v1/user returns email', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        id: '1234567',
        email: 'maria@example.com',
        full_name: 'Maria Garcia',
      },
    }));
    expect(await identify()).toBe('maria@example.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://api.todoist.com/api/v1/user');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('empty email falls back to full_name', async () => {
    stubFetch(() => ({
      status: 200,
      body: { email: '', full_name: 'Maria Garcia' },
    }));
    expect(await identify()).toBe('Maria Garcia');
  });

  test('missing email falls back to full_name', async () => {
    stubFetch(() => ({ status: 200, body: { full_name: 'Maria Garcia' } }));
    expect(await identify()).toBe('Maria Garcia');
  });

  test('empty email and empty full_name returns undefined, never empty string', async () => {
    stubFetch(() => ({ status: 200, body: { email: '', full_name: '' } }));
    expect(await identify()).toBeUndefined();
  });

  test('null body returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: null }));
    expect(await identify()).toBeUndefined();
  });

  test.each([401, 403, 500])(
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

type TodoistOAuthValue = Parameters<
  NonNullable<(typeof todoistAuth)['getConnectionIdentifier']>
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
