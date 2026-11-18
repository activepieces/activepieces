import { afterEach, describe, expect, test, vi } from 'vitest';
import { ActiveCampaignApiError, ActiveCampaignClient, ActiveCampaignNetworkError, activeCampaignApi } from '../src/lib/common/client';

vi.mock('undici', () => ({
  Agent: class {
    readonly options: unknown;
    constructor(options: unknown) {
      this.options = options;
    }
  },
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('normalizeApiUrl', () => {
  test.each([
    ['https://acme.api-us1.com', 'https://acme.api-us1.com'],
    ['acme.api-us1.com', 'https://acme.api-us1.com'],
    ['  https://acme.api-us1.com/  ', 'https://acme.api-us1.com'],
    ['https://acme.api-us1.com/api/3', 'https://acme.api-us1.com'],
    ['https://acme.api-us1.com/api/3/', 'https://acme.api-us1.com'],
    ['HTTPS://ACME.api-us1.com/API/3', 'https://acme.api-us1.com'],
    ['http://acme.api-us1.com', 'https://acme.api-us1.com'],
    ['HTTP://acme.api-us1.com/api/3/', 'https://acme.api-us1.com'],
    ['http://acme.api-us1.com:8443', 'https://acme.api-us1.com:8443'],
  ])('%s -> %s', (input, expected) => {
    expect(activeCampaignApi.normalizeApiUrl(input)).toBe(expected);
  });

  test.each(['ftp://acme.api-us1.com', 'http://user:pw@acme.api-us1.com', 'https://user:pw@acme.api-us1.com', 'https://acme.api-us1.com?x=1', '', 'https://'])('rejects %s', (input) => {
    expect(() => activeCampaignApi.normalizeApiUrl(input)).toThrow();
  });
});

describe('request', () => {
  test('sends the token header, JSON body and a TLS-verifying dispatcher', async () => {
    const seen = stubFetch({ respond: () => ({ status: 201, body: { contact: { id: '9' } } }) });
    const client = new ActiveCampaignClient({ apiUrl: 'acme.api-us1.com/api/3', apiKey: ' key-1 ' });
    const response = await client.request({ method: 'POST', path: '/contacts', body: { contact: { email: 'a@b.co' } } });
    expect(response).toEqual({ status: 201, body: { contact: { id: '9' } } });
    expect(seen[0].url).toBe('https://acme.api-us1.com/api/3/contacts');
    expect(seen[0].method).toBe('POST');
    expect(seen[0].headers.get('api-token')).toBe('key-1');
    expect(seen[0].headers.get('accept')).toBe('application/json');
    expect(seen[0].headers.get('content-type')).toBe('application/json');
    expect(seen[0].body).toEqual({ contact: { email: 'a@b.co' } });
    expect(seen[0].redirect).toBe('manual');
    expect(seen[0].signal).toBeInstanceOf(AbortSignal);
    expect(seen[0].dispatcher).toEqual({ options: { connect: { rejectUnauthorized: true } } });
  });

  test('a redirect is not followed and fails as an API error', async () => {
    const seen = stubFetch({ respond: () => ({ status: 302, text: '', headers: { location: 'https://evil.example.com/api/3/users' } }) });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    const error = await client.request({ method: 'GET', path: '/users' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ActiveCampaignApiError);
    expect(error).toMatchObject({ status: 302 });
    expect(seen).toHaveLength(1);
  });

  test('an empty 2xx body becomes an empty object', async () => {
    stubFetch({ respond: () => ({ status: 200, text: '' }) });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    expect(await client.request({ method: 'DELETE', path: '/webhooks/1' })).toEqual({ status: 200, body: {} });
  });

  test('the error carries status and vendor text but never the request body', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    stubFetch({
      respond: () => ({ status: 422, body: { errors: [{ title: 'Email address already exists in the system.', code: 'duplicate' }] } }),
    });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    const error = await client
      .request({ method: 'POST', path: '/contacts', body: { contact: { email: 'secret-person@example.com', phone: '555-0100' } } })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ActiveCampaignApiError);
    expect(error).toMatchObject({ status: 422 });
    const message = error instanceof Error ? error.message : '';
    expect(message).toContain('POST /contacts failed (422): Email address already exists in the system.');
    expect(message).not.toContain('secret-person');
    expect(message).not.toContain('555-0100');
    expect(Object.keys(error instanceof Error ? error : {})).not.toContain('body');
    const logged = JSON.stringify(vi.mocked(console.error).mock.calls);
    expect(logged).not.toContain('secret-person');
    expect(logged).not.toContain('555-0100');
  });

  test('a plain-text error body is surfaced', async () => {
    stubFetch({ respond: () => ({ status: 422, text: 'Unsubscribed contact cannot be re-subscribed through API.' }) });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    await expect(client.request({ method: 'POST', path: '/contactLists', body: {} })).rejects.toThrow('cannot be re-subscribed');
  });

  test('a GET 429 is retried twice with backoff; a POST 429 is not', async () => {
    const sleep = vi.spyOn(activeCampaignApi, 'sleep').mockResolvedValue(undefined);
    const seen = stubFetch({
      respond: ({ index }) => (index < 2 ? { status: 429, body: {} } : { status: 200, body: { users: [] } }),
    });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    await client.request({ method: 'GET', path: '/users' });
    expect(seen).toHaveLength(3);
    expect(sleep.mock.calls).toEqual([[1000], [2000]]);

    const exhausted = stubFetch({ respond: () => ({ status: 429, body: {} }) });
    await expect(client.request({ method: 'PUT', path: '/deals/1', body: {} })).rejects.toThrow('Rate limit reached');
    expect(exhausted).toHaveLength(3);

    const postSeen = stubFetch({ respond: () => ({ status: 429, body: {} }) });
    await expect(client.request({ method: 'POST', path: '/deals', body: {} })).rejects.toThrow('(429)');
    expect(postSeen).toHaveLength(1);
  });

  test('a timeout is reported as a network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new DOMException('This operation was aborted', 'AbortError');
      }),
    );
    const client = new ActiveCampaignClient({ apiUrl: 'https://slow.api-us1.com', apiKey: 'k' });
    await expect(client.request({ method: 'GET', path: '/users/me' })).rejects.toThrow('Could not reach slow.api-us1.com: the request timed out.');
  });

  test('a network failure names the host', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed', { cause: { code: 'ENOTFOUND' } });
      }),
    );
    const client = new ActiveCampaignClient({ apiUrl: 'https://nope.api-us1.com', apiKey: 'k' });
    const error = await client.request({ method: 'GET', path: '/users/me' }).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ActiveCampaignNetworkError);
    expect(error instanceof Error ? error.message : '').toBe('Could not reach nope.api-us1.com: ENOTFOUND. Check the API URL in the connection.');
  });

  test('path segments are URL-encoded', async () => {
    const seen = stubFetch({ respond: () => ({ status: 200, body: {} }) });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    await client.unsubscribeWebhook('1/../2');
    expect(seen[0].url).toBe('https://acme.api-us1.com/api/3/webhooks/1%2F..%2F2');
    await expect(client.unsubscribeWebhook('..')).rejects.toThrow('path must be relative');
  });
});

describe('pagination', () => {
  test('listPage converts the string meta.total and computes hasMore', async () => {
    const seen = stubFetch({ respond: () => ({ status: 200, body: { contacts: [{ id: '1' }, { id: '2' }], meta: { total: '5' } } }) });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    const page = await client.listPage({ path: '/contacts', key: 'contacts', limit: 2, offset: 2 });
    expect(page).toEqual({ items: [{ id: '1' }, { id: '2' }], total: 5, offset: 2, limit: 2, hasMore: true });
    expect(seen[0].query.get('limit')).toBe('2');
    expect(seen[0].query.get('offset')).toBe('2');
  });

  test('listPage reports hasMore false on the last page', async () => {
    stubFetch({ respond: () => ({ status: 200, body: { contacts: [{ id: '5' }], meta: { total: '5' } } }) });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    const page = await client.listPage({ path: '/contacts', key: 'contacts', limit: 2, offset: 4 });
    expect(page.hasMore).toBe(false);
    expect(page.total).toBe(5);
  });

  test('listAll sends the advancing offset and stops at meta.total', async () => {
    const all = Array.from({ length: 150 }, (_, index) => ({ id: String(index + 1) }));
    const seen = stubFetch({
      respond: ({ request }) => {
        const offset = Number(request.query.get('offset'));
        return { status: 200, body: { users: all.slice(offset, offset + 100), meta: { total: '150' } } };
      },
    });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    const result = await client.listAll({ path: '/users', key: 'users' });
    expect(result.items).toHaveLength(150);
    expect(seen.map((request) => request.query.get('offset'))).toEqual(['0', '100']);
    expect(seen.every((request) => request.query.get('limit') === '100')).toBe(true);
  });

  test('listAll throws instead of truncating at the cap', async () => {
    stubFetch({
      respond: ({ request }) => {
        const offset = Number(request.query.get('offset'));
        return { status: 200, body: { users: Array.from({ length: 100 }, (_, index) => ({ id: String(offset + index) })), meta: { total: '5000' } } };
      },
    });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    await expect(client.listAll({ path: '/users', key: 'users', cap: 200 })).rejects.toThrow('more than 200 records');
  });
});

describe('removeTagFromContact', () => {
  test('deletes the matching association', async () => {
    const seen = stubFetch({
      respond: ({ request }) =>
        request.method === 'GET'
          ? { status: 200, body: { contactTags: [{ id: '70', tag: '4' }, { id: '71', tag: '5' }], meta: { total: '2' } } }
          : { status: 200, body: {} },
    });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    expect(await client.removeTagFromContact({ contactId: '9', tagId: '5' })).toEqual({ removed: true, contactId: '9', tagId: '5' });
    expect(seen[0].path).toBe('/api/3/contacts/9/contactTags');
    expect(seen[1]).toMatchObject({ method: 'DELETE', path: '/api/3/contactTags/71' });
  });

  test('is a no-op when the contact does not have the tag', async () => {
    const seen = stubFetch({ respond: () => ({ status: 200, body: { contactTags: [{ id: '70', tag: '4' }], meta: { total: '1' } } }) });
    const client = new ActiveCampaignClient({ apiUrl: 'https://acme.api-us1.com', apiKey: 'k' });
    expect(await client.removeTagFromContact({ contactId: '9', tagId: '5' })).toEqual({ removed: false, contactId: '9', tagId: '5' });
    expect(seen).toHaveLength(1);
  });
});

function stubFetch({ respond }: { respond: (params: { request: SeenRequest; index: number }) => FakeReply }): SeenRequest[] {
  const seen: SeenRequest[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit & { dispatcher?: unknown }) => {
      const parsed = new URL(input);
      const raw = typeof init?.body === 'string' ? init.body : null;
      const request: SeenRequest = {
        url: input,
        method: init?.method ?? 'GET',
        path: parsed.pathname,
        query: parsed.searchParams,
        headers: new Headers(init?.headers),
        body: raw === null ? null : JSON.parse(raw),
        redirect: init?.redirect,
        signal: init?.signal ?? undefined,
        dispatcher: init?.dispatcher,
      };
      seen.push(request);
      const reply = respond({ request, index: seen.length - 1 });
      const text = reply.text ?? JSON.stringify(reply.body ?? {});
      return new Response(text === '' && reply.status >= 300 && reply.status < 400 ? null : text, { status: reply.status, headers: reply.headers });
    }),
  );
  return seen;
}

type SeenRequest = {
  url: string;
  method: string;
  path: string;
  query: URLSearchParams;
  headers: Headers;
  body: unknown;
  redirect: RequestRedirect | undefined;
  signal: AbortSignal | undefined;
  dispatcher: unknown;
};

type FakeReply = { status: number; body?: unknown; text?: string; headers?: Record<string, string> };
