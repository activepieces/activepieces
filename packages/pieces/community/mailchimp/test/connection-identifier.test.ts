import { afterEach, describe, expect, test, vi } from 'vitest';
import { mailchimpAuth } from '../src';

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

function oauth(extra: Partial<MailchimpOAuthValue> = {}): MailchimpOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

async function identify(auth: MailchimpOAuthValue = oauth()) {
  const hook = mailchimpAuth.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('mailchimpAuth has no getConnectionIdentifier hook');
  }
  return hook({ auth, server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('mailchimp getConnectionIdentifier', () => {
  test('happy path: login.email from oauth2/metadata with the OAuth header', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: {
        dc: 'us6',
        accountname: 'Acme',
        login: { email: 'pat@acme.com', login_email: 'other@acme.com' },
      },
    }));
    expect(await identify()).toBe('pat@acme.com');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://login.mailchimp.com/oauth2/metadata');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('OAuth TKN');
  });

  test('empty login.email falls back to login.login_email', async () => {
    stubFetch(() => ({
      status: 200,
      body: {
        accountname: 'Acme',
        login: { email: '', login_email: 'login@acme.com' },
      },
    }));
    expect(await identify()).toBe('login@acme.com');
  });

  test('no login emails falls back to accountname', async () => {
    stubFetch(() => ({
      status: 200,
      body: { accountname: 'Acme Inc', login: { email: '', login_email: '' } },
    }));
    expect(await identify()).toBe('Acme Inc');
  });

  test('missing login object falls back to accountname', async () => {
    stubFetch(() => ({
      status: 200,
      body: { dc: 'us6', accountname: 'Acme Inc' },
    }));
    expect(await identify()).toBe('Acme Inc');
  });

  test('all fields empty or missing returns undefined', async () => {
    stubFetch(() => ({
      status: 200,
      body: { dc: 'us6', accountname: '', login: {} },
    }));
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

type MailchimpOAuthValue = Parameters<
  NonNullable<(typeof mailchimpAuth)['getConnectionIdentifier']>
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
