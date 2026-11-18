import { PropertyType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { gmailAuth } from '../src/lib/auth';

vi.mock('@googleapis/oauth2', () => ({
  oauth2: () => {
    throw new Error('googleapis must not be used by the hook');
  },
}));
vi.mock('google-auth-library', () => ({
  JWT: class {},
  OAuth2Client: class {},
}));

const server = {
  apiUrl: 'http://localhost:3000/api/',
  publicUrl: 'http://localhost:4200/',
};

const oauthAuth = gmailAuth[0];

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

function oauth(extra: Partial<GmailOAuthValue> = {}): GmailOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function identify(auth: GmailOAuthValue = oauth()) {
  if (oauthAuth.type !== PropertyType.OAUTH2) {
    throw new Error('gmailAuth[0] is not the OAuth2 auth');
  }
  const hook = oauthAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('gmailAuth[0] has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('gmail getConnectionIdentifier', () => {
  test('happy path: Gmail users.getProfile returns emailAddress', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        emailAddress: 'pat@example.com',
        messagesTotal: 10,
        threadsTotal: 5,
        historyId: '1',
      },
    }));
    expect(await identify()).toBe('pat@example.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe(
      'https://gmail.googleapis.com/gmail/v1/users/me/profile'
    );
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
  });

  test('does not hit the userinfo endpoint (needs the email scope old connections may lack)', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: { emailAddress: 'pat@example.com' },
    }));
    await identify();
    expect(seen.some((s) => s.url.includes('userinfo'))).toBe(false);
  });

  test('empty emailAddress returns undefined, never empty string', async () => {
    stubFetch(() => ({ status: 200, body: { emailAddress: '' } }));
    expect(await identify()).toBeUndefined();
  });

  test('missing emailAddress returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: { messagesTotal: 1 } }));
    expect(await identify()).toBeUndefined();
  });

  test('null body returns undefined', async () => {
    stubFetch(() => ({ status: 200, body: null }));
    expect(await identify()).toBeUndefined();
  });

  test.each([401, 403, 500])(
    'HTTP %i returns undefined without throwing',
    async (status) => {
      stubFetch(() => ({ status, body: { error: { code: status } } }));
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

  test('only the OAuth2 auth carries the hook; the service-account auth does not', () => {
    expect(typeof oauthAuth.getConnectionIdentifier).toBe('function');
    expect(gmailAuth[1].getConnectionIdentifier).toBeUndefined();
  });
});

type GmailOAuthValue = Parameters<
  NonNullable<
    Extract<
      (typeof gmailAuth)[number],
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
