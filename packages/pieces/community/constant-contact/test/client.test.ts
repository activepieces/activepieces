import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { ConstantContactApiError, ccClient, ccContacts, ccTransport } from '../src/lib/common/client';

beforeEach(() => stubTransport());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('request', () => {
  test('sends the bearer token to the fixed base URL without following redirects', async () => {
    const seen = route({ routes: { 'GET /v3/contact_lists': { status: 200, body: { lists: [] } } } });
    await ccClient.request({ accessToken: ' test-token ', method: 'GET', path: '/contact_lists', operation: 'list', query: { limit: 10, name: '' } });
    expect(seen[0].url.origin).toBe('https://api.cc.email');
    expect(seen[0].authorization).toBe('Bearer test-token');
    expect(seen[0].redirect).toBe('manual');
    expect(seen[0].query.get('limit')).toBe('10');
    expect(seen[0].query.has('name')).toBe(false);
  });

  test('goes through httpClient with the verified-TLS dispatcher and a 60 s timeout', async () => {
    const dispatcher = { name: 'verified-tls-agent' };
    vi.spyOn(ccTransport, 'getDispatcher').mockResolvedValue(dispatcher);
    const sendRequest = vi.spyOn(httpClient, 'sendRequest');
    const inits: unknown[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: string, init?: RequestInit) => {
        inits.push(init);
        return new Response(JSON.stringify({ lists: [] }), { status: 200 });
      }),
    );
    await ccClient.request({ accessToken: 't', method: 'GET', path: '/contact_lists', operation: 'list' });
    expect(sendRequest).toHaveBeenCalledWith(expect.objectContaining({ timeout: 60_000, followRedirects: false, redactBodyInErrors: true }), { dispatcher });
    expect(inits[0]).toEqual(expect.objectContaining({ dispatcher, redirect: 'manual' }));
  });

  test('the shared client error log never contains the request body', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    route({ routes: { 'POST /v3/contacts/sign_up_form': { status: 400, body: [{ error_key: 'contacts.api.validation.error', error_message: 'bad' }] } } });
    await expect(
      ccClient.request({ accessToken: 't', method: 'POST', path: '/contacts/sign_up_form', operation: 'create or update contact', body: { email_address: 'secret.person@example.com' } }),
    ).rejects.toThrow('HTTP 400');
    expect(logged).toHaveBeenCalled();
    expect(JSON.stringify(logged.mock.calls.map((call) => call.map((part) => (part instanceof Error ? `${part.message} ${JSON.stringify(part)}` : String(part)))))).not.toContain('secret.person');
  });

  test('errors carry status and vendor text but never the request body or token', async () => {
    route({ routes: { 'POST /v3/contacts/sign_up_form': { status: 400, body: [{ error_key: 'contacts.api.validation.error', error_message: 'list_memberships is required' }] } } });
    const error = await ccClient
      .request({ accessToken: 'test-token', method: 'POST', path: '/contacts/sign_up_form', operation: 'create or update contact', body: { email_address: 'secret.person@example.com' } })
      .catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ConstantContactApiError);
    const apiError = error instanceof ConstantContactApiError ? error : undefined;
    expect(apiError?.status).toBe(400);
    expect(apiError?.message).toContain('list_memberships is required');
    expect(apiError?.message).toContain('contacts.api.validation.error');
    expect(apiError?.message).not.toContain('secret.person');
    expect(apiError?.message).not.toContain('test-token');
    expect(Object.keys(apiError ?? {})).not.toContain('body');
  });

  test('403 on a campaign endpoint asks to reconnect for that scope', async () => {
    route({ routes: { 'GET /v3/emails': { status: 403, body: { error_key: 'forbidden', error_message: 'Forbidden' } } } });
    await expect(
      ccClient.request({ accessToken: 't', method: 'GET', path: '/emails', operation: 'list email campaigns', requiredScope: 'campaign_data' }),
    ).rejects.toThrow(/Reconnect the Constant Contact connection to grant campaign_data/);
  });

  test('vendor messages are trimmed so the hint has no double space', async () => {
    route({ routes: { 'GET /v3/emails': { status: 403, body: { error_key: 'unauthorized', error_message: ' insufficient.authorization.scopes' } } } });
    const error = await ccClient.request({ accessToken: 't', method: 'GET', path: '/emails', operation: 'list', requiredScope: 'campaign_data' }).catch((caught: unknown) => caught);
    expect(String(error)).toContain('action. insufficient.authorization.scopes');
    expect(String(error)).not.toContain('  ');
  });

  test('401 asks to reconnect without claiming old connections expire', async () => {
    route({ routes: { 'GET /v3/contacts': { status: 401, body: { error_key: 'unauthorized', error_message: 'Unauthorized' } } } });
    const error = await ccClient.request({ accessToken: 't', method: 'GET', path: '/contacts', operation: 'find' }).catch((caught: unknown) => caught);
    expect(String(error)).toContain('Reconnect the Constant Contact connection.');
    expect(String(error)).not.toContain('24 hours');
  });

  test('403 on a contact endpoint does not mention a new scope', async () => {
    route({ routes: { 'GET /v3/contacts': { status: 403, body: { error_key: 'forbidden', error_message: 'Forbidden' } } } });
    const error = await ccClient.request({ accessToken: 't', method: 'GET', path: '/contacts', operation: 'find' }).catch((caught: unknown) => caught);
    expect(String(error)).toContain('lacks the privilege');
    expect(String(error)).not.toContain('campaign_data');
  });

  test('throttled 429 is retried twice on GET', async () => {
    const seen = route({
      routes: {
        'GET /v3/contacts': [
          { status: 429, body: { error_key: 'throttled', error_message: 'Too many' } },
          { status: 429, body: { error_key: 'throttled', error_message: 'Too many' } },
          { status: 200, body: { contacts: [] } },
        ],
      },
    });
    await ccClient.request({ accessToken: 't', method: 'GET', path: '/contacts', operation: 'find' });
    expect(seen).toHaveLength(3);
  });

  test('POST is never retried on 429', async () => {
    const seen = route({ routes: { 'POST /v3/contact_tags': { status: 429, body: { error_key: 'throttled', error_message: 'Too many' } } } });
    await expect(ccClient.request({ accessToken: 't', method: 'POST', path: '/contact_tags', operation: 'create tag', body: { name: 'x' } })).rejects.toThrow('HTTP 429');
    expect(seen).toHaveLength(1);
  });

  test('daily quota 429 is not retried and explains the reset', async () => {
    const seen = route({ routes: { 'GET /v3/contacts': { status: 429, body: { error_key: 'quota_exceeded', error_message: 'Quota' } } } });
    await expect(ccClient.request({ accessToken: 't', method: 'GET', path: '/contacts', operation: 'find' })).rejects.toThrow('resets at 00:00 UTC');
    expect(seen).toHaveLength(1);
  });

  test('timeout on a write says it may still have been applied', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
      }),
    );
    await expect(ccClient.request({ accessToken: 't', method: 'POST', path: '/contact_tags', operation: 'create tag', body: { name: 'x' } })).rejects.toThrow(
      /Constant Contact create tag did not respond within 60 seconds\. It may still have been applied/,
    );
  });

  test('network error on a read names the operation and the code', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed', { cause: { code: 'ECONNRESET' } });
      }),
    );
    const error = await ccClient.request({ accessToken: 't', method: 'GET', path: '/contacts', operation: 'find contacts' }).catch((caught: unknown) => caught);
    expect(String(error)).toContain('Could not reach Constant Contact for find contacts: ECONNRESET.');
    expect(String(error)).not.toContain('may still have been applied');
  });

  test('refuses paths that could leave the API base', async () => {
    route({ routes: {} });
    for (const path of ['//evil.example/x', '/contacts/../../x', 'contacts', '/contacts?x=1']) {
      await expect(ccClient.request({ accessToken: 't', method: 'GET', path, operation: 'x' })).rejects.toThrow('unexpected path');
    }
  });

  test('redirects are not followed', async () => {
    route({ routes: { 'GET /v3/contacts': { status: 302, body: {} } } });
    await expect(ccClient.request({ accessToken: 't', method: 'GET', path: '/contacts', operation: 'find' })).rejects.toThrow('unexpected redirect');
  });
});

describe('pagination', () => {
  test('listAll follows the cursor from _links.next.href on the fixed origin', async () => {
    const seen = route({
      routes: {
        'GET /v3/contact_tags': [
          { status: 200, body: { tags: [{ tag_id: 'a' }], _links: { next: { href: '/v3/contact_tags?limit=1&cursor=bGltaXQ9MQ==' } } } },
          { status: 200, body: { tags: [{ tag_id: 'b' }] } },
        ],
      },
    });
    const items = await ccClient.listAll({ accessToken: 't', path: '/contact_tags', key: 'tags', operation: 'list tags', query: { limit: 1 }, maxItems: 100 });
    expect(items.map((item) => item['tag_id'])).toEqual(['a', 'b']);
    expect(seen[1].query.get('cursor')).toBe('bGltaXQ9MQ==');
    expect(seen[1].url.origin).toBe('https://api.cc.email');
  });

  test('a next link on another host is refused', async () => {
    const seen = route({
      routes: { 'GET /v3/contact_tags': { status: 200, body: { tags: [{ tag_id: 'a' }], _links: { next: { href: 'https://api.cc.email.evil.io/v3/contact_tags?cursor=x' } } } } },
    });
    await expect(ccClient.listAll({ accessToken: 't', path: '/contact_tags', key: 'tags', operation: 'list tags', maxItems: 100 })).rejects.toThrow('different host or path');
    expect(seen).toHaveLength(1);
  });

  test('a next link to another path is refused', async () => {
    route({ routes: { 'GET /v3/contact_tags': { status: 200, body: { tags: [], _links: { next: { href: '/v3/account/emails?cursor=x' } } } } } });
    await expect(ccClient.listPage({ accessToken: 't', path: '/contact_tags', key: 'tags', operation: 'list tags' })).rejects.toThrow('different host or path');
  });

  test('the cap throws instead of truncating', async () => {
    route({ routes: { 'GET /v3/contact_tags': { status: 200, body: { tags: [{ tag_id: 'a' }, { tag_id: 'b' }], _links: { next: { href: '/v3/contact_tags?cursor=abc' } } } } } });
    await expect(ccClient.listAll({ accessToken: 't', path: '/contact_tags', key: 'tags', operation: 'list tags', maxItems: 2 })).rejects.toThrow('more than 2 records');
  });

  test('listPage returns the next cursor', async () => {
    route({ routes: { 'GET /v3/contact_lists': { status: 200, body: { lists: [{ list_id: 'x' }], _links: { next: { href: '/v3/contact_lists?cursor=Y3Vy' } } } } } });
    const page = await ccClient.listPage({ accessToken: 't', path: '/contact_lists', key: 'lists', operation: 'list' });
    expect(page.nextCursor).toBe('Y3Vy');
  });
});

describe('contact PUT body', () => {
  const current = {
    contact_id: CONTACT_ID,
    email_address: { address: 'jane@example.com', permission_to_send: 'unsubscribed', opt_out_source: 'Contact' },
    first_name: 'Jane',
    last_name: 'Doe',
    job_title: 'Owner',
    company_name: 'Example Co',
    birthday_month: 4,
    birthday_day: 2,
    phone_numbers: [{ phone_number_id: 'p1', phone_number: '111', kind: 'home' }, { phone_number_id: 'p2', phone_number: '222', kind: 'work' }],
    street_addresses: [{ street_address_id: 's1', kind: 'home', street: '1 Main', city: 'Town' }],
    custom_fields: [{ custom_field_id: FIELD_A, value: 'Old' }],
    list_memberships: [LIST_A],
  };

  test('keeps top-level fields and the current permission; omits untouched subresources', () => {
    const body = ccContacts.buildPutBody({ current, changes: { first_name: 'Janet' } });
    expect(body).toEqual({
      email_address: { address: 'jane@example.com', permission_to_send: 'unsubscribed' },
      first_name: 'Janet',
      last_name: 'Doe',
      job_title: 'Owner',
      company_name: 'Example Co',
      birthday_month: 4,
      birthday_day: 2,
      update_source: 'Account',
    });
  });

  test('phone and address replace the same kind; custom fields merge; lists are a union', () => {
    const body = ccContacts.buildPutBody({
      current,
      changes: {
        phone: { phone_number: '333', kind: 'work' },
        street_address: { kind: 'home', city: 'City' },
        custom_fields: [{ custom_field_id: FIELD_A, value: 'New' }],
        add_list_ids: [LIST_B, LIST_A],
      },
    });
    expect(body['phone_numbers']).toEqual([{ phone_number: '111', kind: 'home' }, { phone_number: '333', kind: 'work' }]);
    expect(body['street_addresses']).toEqual([{ kind: 'home', street: '1 Main', city: 'City' }]);
    expect(body['custom_fields']).toEqual([{ custom_field_id: FIELD_A, value: 'New' }]);
    expect(body['list_memberships']).toEqual([LIST_A, LIST_B]);
  });

  test('a fourth phone number is refused', () => {
    const three = { ...current, phone_numbers: [...current.phone_numbers, { phone_number: '9', kind: 'mobile' }] };
    expect(() => ccContacts.buildPutBody({ current: three, changes: { phone: { phone_number: '1', kind: 'other' } } })).toThrow('at most 3 phone numbers');
  });

  test('refuses to update a deleted contact because PUT would restore it', () => {
    expect(() => ccContacts.buildPutBody({ current: { ...current, deleted_at: '2026-01-01T00:00:00Z' }, changes: { first_name: 'x' } })).toThrow('deleted');
  });

  test('unsubscribe sets only the permission and reason', () => {
    const body = ccContacts.buildPutBody({ current: { ...current, email_address: { address: 'jane@example.com', permission_to_send: 'explicit' } }, changes: {}, unsubscribe: { reason: 'asked' } });
    expect(body['email_address']).toEqual({ address: 'jane@example.com', permission_to_send: 'unsubscribed', opt_out_reason: 'asked' });
    expect(body['list_memberships']).toBeUndefined();
  });
});

describe('bulk activities', () => {
  test('sends only source.contact_ids and waits for completion', async () => {
    const seen = route({
      routes: {
        'POST /v3/activities/add_list_memberships': { status: 201, body: { activity_id: 'act-1', state: 'initialized', activity_errors: [] } },
        'GET /v3/activities/act-1': [{ status: 200, body: { activity_id: 'act-1', state: 'processing', activity_errors: [] } }, { status: 200, body: { activity_id: 'act-1', state: 'completed', activity_errors: [] } }],
      },
    });
    const activity = await ccContacts.runActivity({ accessToken: 't', kind: 'add_list_memberships', contactIds: [CONTACT_ID], targetIds: [LIST_A] });
    expect(activity['state']).toBe('completed');
    expect(seen[0].body).toEqual({ source: { contact_ids: [CONTACT_ID] }, list_ids: [LIST_A] });
  });

  test('tag activities send tag_ids', async () => {
    const seen = route({ routes: { 'POST /v3/activities/contacts_taggings_remove': { status: 201, body: { activity_id: 'act-2', state: 'completed', activity_errors: [] } } } });
    await ccContacts.runActivity({ accessToken: 't', kind: 'contacts_taggings_remove', contactIds: [CONTACT_ID], targetIds: [TAG_A] });
    expect(seen[0].body).toEqual({ source: { contact_ids: [CONTACT_ID] }, tag_ids: [TAG_A] });
  });

  test('fails the step on activity errors or a failed state', async () => {
    route({
      routes: {
        'POST /v3/activities/add_list_memberships': { status: 201, body: { activity_id: 'act-3', state: 'initialized' } },
        'GET /v3/activities/act-3': { status: 200, body: { activity_id: 'act-3', state: 'failed', activity_errors: ['List not found'] } },
      },
    });
    await expect(ccContacts.runActivity({ accessToken: 't', kind: 'add_list_memberships', contactIds: [CONTACT_ID], targetIds: [LIST_A] })).rejects.toThrow(
      'failed (activity act-3): List not found',
    );
  });

  test('returns a still-processing activity after the wait instead of failing', async () => {
    route({
      routes: {
        'POST /v3/activities/add_list_memberships': { status: 201, body: { activity_id: 'act-4', state: 'initialized' } },
        'GET /v3/activities/act-4': { status: 200, body: { activity_id: 'act-4', state: 'processing', activity_errors: [] } },
      },
    });
    const activity = await ccContacts.runActivity({ accessToken: 't', kind: 'add_list_memberships', contactIds: [CONTACT_ID], targetIds: [LIST_A] });
    expect(activity['state']).toBe('processing');
  });
});

describe('qa edge cases', () => {
  test('a failed activity state without activity_errors still fails the step', async () => {
    route({
      routes: {
        'POST /v3/activities/contacts_taggings_add': { status: 201, body: { activity_id: 'act-5', state: 'initialized' } },
        'GET /v3/activities/act-5': { status: 200, body: { activity_id: 'act-5', state: 'cancelled', activity_errors: [] } },
      },
    });
    await expect(ccContacts.runActivity({ accessToken: 't', kind: 'contacts_taggings_add', contactIds: [CONTACT_ID], targetIds: [TAG_A] })).rejects.toThrow(
      'ended in state "cancelled"',
    );
  });

  test('an accepted activity without an activity_id fails instead of reporting success', async () => {
    route({ routes: { 'POST /v3/activities/add_list_memberships': { status: 201, body: {} } } });
    await expect(ccContacts.runActivity({ accessToken: 't', kind: 'add_list_memberships', contactIds: [CONTACT_ID], targetIds: [LIST_A] })).rejects.toThrow(
      'no activity ID came back',
    );
  });

  test('an email lookup picks the exact match, not the first fuzzy hit', async () => {
    route({
      routes: {
        'GET /v3/contacts': {
          status: 200,
          body: { contacts: [{ contact_id: OTHER_ID, email_address: { address: 'jane.other@example.com' } }, { contact_id: CONTACT_ID, email_address: { address: 'jane@example.com' } }] },
        },
      },
    });
    expect(await ccContacts.resolveContactId({ accessToken: 't', value: 'jane@example.com', label: 'Contact' })).toBe(CONTACT_ID);
  });

  test('an email lookup with only a fuzzy hit fails instead of acting on the wrong contact', async () => {
    route({ routes: { 'GET /v3/contacts': { status: 200, body: { contacts: [{ contact_id: OTHER_ID, email_address: { address: 'jane.other@example.com' } }] } } } });
    await expect(ccContacts.resolveContactId({ accessToken: 't', value: 'jane@example.com', label: 'Contact' })).rejects.toThrow('No Constant Contact contact has the email');
  });

  test('a non-JSON error body is reported, truncated, with the status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(`<html>${'x'.repeat(5000)}</html>`, { status: 502 })),
    );
    const error = await ccClient.request({ accessToken: 't', method: 'GET', path: '/contacts', operation: 'find' }).catch((caught: unknown) => caught);
    expect(String(error)).toContain('HTTP 502');
    expect(String(error)).toContain('server error');
    expect(String(error).length).toBeLessThan(800);
  });

  test('a 401 asks to reconnect', async () => {
    route({ routes: { 'GET /v3/contacts': { status: 401, body: { error_key: 'unauthorized', error_message: 'Unauthorized' } } } });
    await expect(ccClient.request({ accessToken: 't', method: 'GET', path: '/contacts', operation: 'find' })).rejects.toThrow(/HTTP 401.*Reconnect/);
  });

  test('throttled 429 on GET gives up after two retries', async () => {
    const seen = route({ routes: { 'GET /v3/contacts': { status: 429, body: { error_key: 'throttled', error_message: 'Too many' } } } });
    await expect(ccClient.request({ accessToken: 't', method: 'GET', path: '/contacts', operation: 'find' })).rejects.toThrow('HTTP 429');
    expect(seen).toHaveLength(3);
  });

  test('a next link without a cursor stops paging with an error', async () => {
    route({ routes: { 'GET /v3/contact_tags': { status: 200, body: { tags: [{ tag_id: 'a' }], _links: { next: { href: '/v3/contact_tags?limit=50' } } } } } });
    await expect(ccClient.listAll({ accessToken: 't', path: '/contact_tags', key: 'tags', operation: 'list tags', maxItems: 100 })).rejects.toThrow('without a cursor');
  });

  test('an empty 200 for a contact fails instead of returning nothing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 200 })),
    );
    await expect(ccContacts.getContact({ accessToken: 't', contactId: CONTACT_ID })).rejects.toThrow('returned no contact');
  });

  test('an empty access token is refused before any request', async () => {
    const seen = route({ routes: {} });
    await expect(ccClient.request({ accessToken: '  ', method: 'GET', path: '/contacts', operation: 'find' })).rejects.toThrow('no access token');
    expect(seen).toHaveLength(0);
  });
});

describe('contact resolution', () => {
  test('a UUID is used as is; an email is looked up exactly', async () => {
    const seen = route({ routes: { 'GET /v3/contacts': { status: 200, body: { contacts: [{ contact_id: CONTACT_ID, email_address: { address: 'Jane@Example.com' } }] } } } });
    expect(await ccContacts.resolveContactId({ accessToken: 't', value: CONTACT_ID.toUpperCase(), label: 'Contact' })).toBe(CONTACT_ID);
    expect(seen).toHaveLength(0);
    expect(await ccContacts.resolveContactId({ accessToken: 't', value: 'jane@example.com', label: 'Contact' })).toBe(CONTACT_ID);
    expect(seen[0].query.get('email')).toBe('jane@example.com');
  });

  test('verify checks a UUID with one GET and refuses deleted contacts', async () => {
    const seen = route({ routes: { [`GET /v3/contacts/${CONTACT_ID}`]: [{ status: 200, body: { contact_id: CONTACT_ID } }, { status: 200, body: { contact_id: CONTACT_ID, deleted_at: '2026-11-11' } }] } });
    expect(await ccContacts.resolveContactId({ accessToken: 't', value: CONTACT_ID, label: 'Contact', verify: true })).toBe(CONTACT_ID);
    expect(seen).toHaveLength(1);
    await expect(ccContacts.resolveContactId({ accessToken: 't', value: CONTACT_ID, label: 'Contact', verify: true })).rejects.toThrow('is deleted');
  });

  test('an unknown email or a non-ID fails clearly', async () => {
    route({ routes: { 'GET /v3/contacts': { status: 200, body: { contacts: [] } } } });
    await expect(ccContacts.resolveContactId({ accessToken: 't', value: 'nobody@example.com', label: 'Contact' })).rejects.toThrow('No Constant Contact contact has the email');
    await expect(ccContacts.resolveContactId({ accessToken: 't', value: 'Jane Doe', label: 'Contact' })).rejects.toThrow('contact ID (a UUID) or an email');
  });
});



function stubTransport(): void {
  vi.spyOn(ccTransport, 'getDispatcher').mockResolvedValue(undefined);
  vi.spyOn(ccTransport, 'sleep').mockResolvedValue(undefined);
}

function route({ routes }: { routes: Record<string, Reply | Reply[]> }): Seen[] {
  const seen: Seen[] = [];
  const counters = new Map<string, number>();
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      const key = `${init?.method ?? 'GET'} ${url.pathname}`;
      const headers = new Headers(init?.headers);
      seen.push({
        key,
        url,
        query: url.searchParams,
        body: typeof init?.body === 'string' ? JSON.parse(init.body) : null,
        authorization: headers.get('authorization'),
        redirect: init?.redirect,
      });
      const entry = routes[key];
      const index = counters.get(key) ?? 0;
      counters.set(key, index + 1);
      const reply = Array.isArray(entry) ? entry[Math.min(index, entry.length - 1)] : entry;
      if (reply === undefined) {
        return new Response(JSON.stringify([{ error_key: 'test.unexpected', error_message: `unexpected ${key}` }]), { status: 599 });
      }
      if (reply.status === 204) {
        return new Response(null, { status: 204 });
      }
      return new Response(JSON.stringify(reply.body), { status: reply.status });
    }),
  );
  return seen;
}



const CONTACT_ID = '1618ae62-4752-11e9-9c8a-fa163e6b01c1';
const LIST_A = '07936f78-662a-11eb-af0a-fa163e56c9b0';
const LIST_B = '17936f78-662a-11eb-af0a-fa163e56c9b0';
const TAG_A = 'c6915956-fde3-4081-977e-c3b8d1b068a7';
const FIELD_A = '2618ae62-4752-11e9-9c8a-fa163e6b01c1';
const OTHER_ID = '3618ae62-4752-11e9-9c8a-fa163e6b01c1';

type Reply = { status: number; body?: unknown };

type Seen = {
  key: string;
  url: URL;
  query: URLSearchParams;
  body: unknown;
  authorization: string | null;
  redirect: RequestRedirect | undefined;
};
