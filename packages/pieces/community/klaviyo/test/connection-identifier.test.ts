import { PropertyType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { klaviyoAuth } from '../src/lib/common/auth';

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

function oauth(extra: Partial<KlaviyoOAuthValue> = {}): KlaviyoOAuthValue {
  return { access_token: 'TKN', data: {}, props: {}, ...extra };
}

function accounts(contact: KlaviyoContact | undefined) {
  return {
    data: [
      {
        type: 'account',
        id: 'ABC',
        attributes: { test_account: false, contact_information: contact },
      },
    ],
  };
}

async function identifyWithApiKey() {
  const variant = klaviyoAuth[0];
  if (variant.type !== PropertyType.SECRET_TEXT) {
    throw new Error('klaviyoAuth[0] is not the API key auth');
  }
  const hook = variant.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('klaviyoAuth[0] has no getConnectionIdentifier hook');
  }
  return hook({ auth: 'pk_123', server });
}

async function identifyWithOAuth() {
  const variant = klaviyoAuth[1];
  if (variant.type !== PropertyType.OAUTH2) {
    throw new Error('klaviyoAuth[1] is not the OAuth2 auth');
  }
  const hook = variant.getConnectionIdentifier;
  if (hook === undefined) {
    throw new Error('klaviyoAuth[1] has no getConnectionIdentifier hook');
  }
  return hook({ auth: oauth(), server });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('klaviyo getConnectionIdentifier', () => {
  test('variant order is [SECRET_TEXT, OAUTH2] and both declare the hook', () => {
    expect(klaviyoAuth[0].type).toBe(PropertyType.SECRET_TEXT);
    expect(klaviyoAuth[1].type).toBe(PropertyType.OAUTH2);
    expect(typeof klaviyoAuth[0].getConnectionIdentifier).toBe('function');
    expect(typeof klaviyoAuth[1].getConnectionIdentifier).toBe('function');
  });

  test('api key: organization_name from /api/accounts with the Klaviyo-API-Key header and revision', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: accounts({
        organization_name: 'Acme Org',
        default_sender_email: 'hello@acme.com',
      }),
    }));
    expect(await identifyWithApiKey()).toBe('Acme Org');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://a.klaviyo.com/api/accounts');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Klaviyo-API-Key pk_123');
    expect(seen[0].headers.get('revision')).toBe('2025-04-15');
  });

  test('oauth: organization_name from /api/accounts with the bearer token and revision', async () => {
    const seen = stubFetch(() => ({
      status: 200,
      body: accounts({
        organization_name: 'Acme Org',
        default_sender_email: 'hello@acme.com',
      }),
    }));
    expect(await identifyWithOAuth()).toBe('Acme Org');
    expect(seen).toHaveLength(1);
    expect(seen[0].url).toBe('https://a.klaviyo.com/api/accounts');
    expect(seen[0].method).toBe('GET');
    expect(seen[0].auth).toBe('Bearer TKN');
    expect(seen[0].headers.get('revision')).toBe('2025-04-15');
  });

  test.each([
    ['api key', identifyWithApiKey],
    ['oauth', identifyWithOAuth],
  ])(
    '%s: empty organization_name falls back to default_sender_email',
    async (_name, identify) => {
      stubFetch(() => ({
        status: 200,
        body: accounts({
          organization_name: '',
          default_sender_email: 'hello@acme.com',
        }),
      }));
      expect(await identify()).toBe('hello@acme.com');
    }
  );

  test.each([
    ['api key', identifyWithApiKey],
    ['oauth', identifyWithOAuth],
  ])('%s: empty contact fields return undefined', async (_name, identify) => {
    stubFetch(() => ({
      status: 200,
      body: accounts({ organization_name: '', default_sender_email: '' }),
    }));
    expect(await identify()).toBeUndefined();
  });

  test.each([
    ['api key', identifyWithApiKey],
    ['oauth', identifyWithOAuth],
  ])(
    '%s: missing contact_information returns undefined',
    async (_name, identify) => {
      stubFetch(() => ({ status: 200, body: accounts(undefined) }));
      expect(await identify()).toBeUndefined();
    }
  );

  test.each([
    ['api key', identifyWithApiKey],
    ['oauth', identifyWithOAuth],
  ])('%s: empty data array returns undefined', async (_name, identify) => {
    stubFetch(() => ({ status: 200, body: { data: [] } }));
    expect(await identify()).toBeUndefined();
  });

  test.each([
    ['api key', 401, identifyWithApiKey],
    ['api key', 403, identifyWithApiKey],
    ['api key', 500, identifyWithApiKey],
    ['oauth', 401, identifyWithOAuth],
    ['oauth', 403, identifyWithOAuth],
    ['oauth', 500, identifyWithOAuth],
  ])(
    '%s: HTTP %i returns undefined without throwing',
    async (_name, status, identify) => {
      stubFetch(() => ({ status, body: { errors: [{ status }] } }));
      await expect(identify()).resolves.toBeUndefined();
    }
  );

  test.each([
    ['api key', identifyWithApiKey],
    ['oauth', identifyWithOAuth],
  ])(
    '%s: network error returns undefined without throwing',
    async (_name, identify) => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          throw new TypeError('fetch failed');
        })
      );
      await expect(identify()).resolves.toBeUndefined();
    }
  );
});

type KlaviyoOAuthValue = Parameters<
  NonNullable<
    Extract<
      (typeof klaviyoAuth)[number],
      { type: PropertyType.OAUTH2 }
    >['getConnectionIdentifier']
  >
>[0]['auth'];

type KlaviyoContact = {
  organization_name?: string;
  default_sender_email?: string;
};

type FetchRequest = { url: string; method: string };

type FakeResponse = { status: number; body: unknown };

type Seen = {
  url: string;
  method: string;
  auth: string | null;
  headers: Headers;
  body: string | null;
};
