import { PropertyType } from '@activepieces/pieces-framework';
import { afterEach, expect, test, vi } from 'vitest';
import { notionAuth, notionOAuth2Auth } from './auth';

const server = {
  apiUrl: 'http://localhost:3000/api/',
  publicUrl: 'http://localhost:4200/',
};

const customAuth = notionAuth[1];

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

function oauth(extra: Partial<NotionOAuthValue> = {}): NotionOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function runOAuth(data: Record<string, unknown>) {
  const hook = notionOAuth2Auth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('notionOAuth2Auth has no getConnectionIdentifier hook');
  }
  return hook({ auth: oauth({ data }), server });
}

async function runCustom() {
  if (customAuth.type !== PropertyType.CUSTOM_AUTH) {
    throw new Error('notionAuth[1] is not the custom auth');
  }
  const hook = customAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('notionAuth[1] has no getConnectionIdentifier hook');
  }
  return hook({ auth: { accessToken: 'secret_xyz' }, server });
}

function personOwner({
  person,
  name = 'Pat Lee',
}: {
  person: Record<string, unknown>;
  name?: string | null;
}) {
  return {
    type: 'user',
    user: {
      object: 'user',
      id: 'u1',
      type: 'person',
      name,
      avatar_url: null,
      person,
    },
  };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

test('notion: variant order is [OAUTH2, CUSTOM_AUTH] and both declare the hook', () => {
  expect(notionAuth[0]).toBe(notionOAuth2Auth);
  expect(customAuth.type).toBe('CUSTOM_AUTH');
  expect(typeof customAuth.getConnectionIdentifier).toBe('function');
});

test('notion oauth: owner email from token data, zero network calls', async () => {
  const seen = stubFetch(() => ({ status: 500, body: {} }));
  expect(
    await runOAuth({
      bot_id: 'b1',
      workspace_name: 'Acme HQ',
      owner: personOwner({ person: { email: 'pat@acme.com' } }),
    })
  ).toBe('pat@acme.com');
  expect(seen).toHaveLength(0);
});

test('notion oauth: no email in token data falls back to workspace_name, zero network calls', async () => {
  const seen = stubFetch(() => ({ status: 500, body: {} }));
  expect(
    await runOAuth({
      workspace_name: 'Acme HQ',
      owner: personOwner({ person: {} }),
    })
  ).toBe('Acme HQ');
  expect(seen).toHaveLength(0);
});

test('notion oauth: empty email and null workspace_name fall back to owner name, zero network calls', async () => {
  const seen = stubFetch(() => ({ status: 500, body: {} }));
  expect(
    await runOAuth({
      workspace_name: null,
      owner: personOwner({ person: { email: '' } }),
    })
  ).toBe('Pat Lee');
  expect(seen).toHaveLength(0);
});

test('notion oauth: token data without identity calls /v1/users/me with Notion-Version and reads the bot owner email', async () => {
  const seen = stubFetch(() => ({
    status: 200,
    body: {
      object: 'user',
      type: 'bot',
      bot: {
        owner: personOwner({ person: { email: 'bot-owner@acme.com' } }),
        workspace_name: 'Acme HQ',
      },
    },
  }));
  expect(
    await runOAuth({
      workspace_name: '',
      owner: { type: 'workspace', workspace: true },
    })
  ).toBe('bot-owner@acme.com');
  expect(seen).toHaveLength(1);
  expect(seen[0].url).toBe('https://api.notion.com/v1/users/me');
  expect(seen[0].method).toBe('GET');
  expect(seen[0].auth).toBe('Bearer TKN');
  expect(seen[0].headers.get('notion-version')).toBe('2022-02-22');
});

test('notion oauth: empty token data falls back to bot workspace_name', async () => {
  stubFetch(() => ({
    status: 200,
    body: {
      type: 'bot',
      bot: {
        owner: { type: 'workspace', workspace: true },
        workspace_name: 'Acme HQ',
      },
    },
  }));
  expect(await runOAuth({})).toBe('Acme HQ');
});

test('notion oauth: empty token data and empty bot returns undefined', async () => {
  stubFetch(() => ({ status: 200, body: { type: 'bot', bot: {} } }));
  expect(await runOAuth({})).toBeUndefined();
});

test.each([401, 403, 500])(
  'notion oauth: empty token data and HTTP %i returns undefined without throwing',
  async (status) => {
    stubFetch(() => ({ status, body: { object: 'error' } }));
    await expect(runOAuth({})).resolves.toBeUndefined();
  }
);

test('notion oauth: empty token data and network error returns undefined without throwing', async () => {
  stubFetch(() => {
    throw new TypeError('fetch failed');
  });
  await expect(runOAuth({})).resolves.toBeUndefined();
});

test('notion custom auth: internal integration bot returns workspace_name', async () => {
  const seen = stubFetch(() => ({
    status: 200,
    body: {
      object: 'user',
      type: 'bot',
      name: 'My integration',
      bot: {
        owner: { type: 'workspace', workspace: true },
        workspace_name: 'Acme HQ',
      },
    },
  }));
  expect(await runCustom()).toBe('Acme HQ');
  expect(seen).toHaveLength(1);
  expect(seen[0].url).toBe('https://api.notion.com/v1/users/me');
  expect(seen[0].method).toBe('GET');
  expect(seen[0].auth).toBe('Bearer secret_xyz');
  expect(seen[0].headers.get('notion-version')).toBe('2022-02-22');
});

test('notion custom auth: missing bot returns undefined', async () => {
  stubFetch(() => ({ status: 200, body: { object: 'user', type: 'bot' } }));
  expect(await runCustom()).toBeUndefined();
});

test.each([401, 500])(
  'notion custom auth: HTTP %i returns undefined without throwing',
  async (status) => {
    stubFetch(() => ({ status, body: { object: 'error' } }));
    await expect(runCustom()).resolves.toBeUndefined();
  }
);

test('notion custom auth: network error returns undefined without throwing', async () => {
  stubFetch(() => {
    throw new TypeError('fetch failed');
  });
  await expect(runCustom()).resolves.toBeUndefined();
});

type NotionOAuthValue = Parameters<
  NonNullable<(typeof notionOAuth2Auth)['getConnectionIdentifier']>
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
