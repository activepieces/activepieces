import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { OutputSchema } from '@activepieces/pieces-framework';
import { ccTransport } from '../src/lib/common/client';
import { createOrUpdateContact } from '../src/lib/actions/create-or-update-contact';
import { findContact } from '../src/lib/actions/find-contact';
import { updateContact } from '../src/lib/actions/update-contact';
import { addContactToList } from '../src/lib/actions/add-contact-to-list';
import { removeContactFromList } from '../src/lib/actions/remove-contact-from-list';
import { addTagToContact } from '../src/lib/actions/add-tag-to-contact';
import { deleteContact } from '../src/lib/actions/delete-contact';
import { constantContact } from '../src';
import { constantContactAuth } from '../src/lib/auth';

beforeEach(() => stubTransport());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('piece wiring', () => {
  test('requests refresh tokens and the new scopes; minimum release allows ai atomics', () => {
    expect(constantContactAuth.scope).toEqual(['contact_data', 'campaign_data', 'account_read', 'offline_access']);
    expect(constantContact.minimumSupportedRelease).toBe('0.88.2');
  });

  test('human actions carry metadata and no ai twin is audience both', () => {
    const actions = Object.values(constantContact.actions());
    const human = [createOrUpdateContact, findContact, updateContact, addContactToList, removeContactFromList, addTagToContact, deleteContact];
    for (const action of human) {
      expect(action.aiMetadata?.description).toBeTruthy();
      expect(action.classification).toBeTruthy();
      expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
    }
    expect(actions.filter((action) => action.audience === 'both').map((action) => action.name)).toEqual(['create_or_update_contact']);
    expect(human.slice(1).every((action) => action.audience === 'human')).toBe(true);
  });
});

describe('create_or_update_contact', () => {
  test('keeps every original prop name', () => {
    expect(Object.keys(createOrUpdateContact.props)).toEqual(
      expect.arrayContaining(['list', 'email_address', 'first_name', 'last_name', 'job_title', 'company_name', 'phoner_number']),
    );
  });

  test('warns about consent in both descriptions', () => {
    expect(createOrUpdateContact.description).toContain('re-subscribes a contact who had unsubscribed');
    expect(createOrUpdateContact.aiMetadata?.description).toContain('RE-SUBSCRIBES');
  });

  test('sends the phone as phone_number and returns contact_id and action', async () => {
    const seen = route({ routes: { 'POST /v3/contacts/sign_up_form': { status: 201, body: { contact_id: CONTACT_ID, action: 'created' } } } });
    const result = await createOrUpdateContact.run(
      ctx({
        propsValue: {
          list: [LIST_A],
          email_address: ' jane@example.com ',
          first_name: 'Jane',
          phoner_number: '+1 555 0100',
          birthday_month: 4,
          birthday_day: 2,
          street: '1 Main St',
          custom_fields: { [FIELD_A]: 'Gold' },
          custom_fields_json: { [FIELD_A]: 'Silver' },
        },
      }),
    );
    expect(result).toEqual({ contact_id: CONTACT_ID, action: 'created' });
    expect(seen[0].body).toEqual({
      email_address: 'jane@example.com',
      first_name: 'Jane',
      phone_number: '+1 555 0100',
      birthday_month: 4,
      birthday_day: 2,
      street_address: { kind: 'home', street: '1 Main St' },
      custom_fields: [{ custom_field_id: FIELD_A, value: 'Gold' }],
      list_memberships: [LIST_A],
    });
    expect(JSON.stringify(seen[0].body)).not.toContain('phoner_number');
  });

  test('validates before calling the API', async () => {
    const seen = route({ routes: {} });
    await expect(createOrUpdateContact.run(ctx({ propsValue: { list: [], email_address: 'a@b.co' } }))).rejects.toThrow('List is required');
    await expect(createOrUpdateContact.run(ctx({ propsValue: { list: [LIST_A], email_address: 'a@b.co', birthday_month: 4 } }))).rejects.toThrow('given together');
    await expect(createOrUpdateContact.run(ctx({ propsValue: { list: [LIST_A], email_address: 'a@b.co', birthday_month: 2, birthday_day: 30 } }))).rejects.toThrow('does not exist');
    const tooMany = Array.from({ length: 51 }, (_, index) => `${String(index).padStart(8, '0')}-662a-11eb-af0a-fa163e56c9b0`);
    await expect(createOrUpdateContact.run(ctx({ propsValue: { list: tooMany, email_address: 'a@b.co' } }))).rejects.toThrow('at most 50');
    expect(seen).toHaveLength(0);
  });

  test('list dropdown pages through every list', async () => {
    const seen = route({
      routes: {
        'GET /v3/contact_lists': [
          { status: 200, body: { lists: [{ list_id: LIST_A, name: 'A' }], _links: { next: { href: '/v3/contact_lists?limit=500&cursor=bmV4dA==' } } } },
          { status: 200, body: { lists: [{ list_id: LIST_B, name: 'B' }] } },
        ],
      },
    });
    const options = await createOrUpdateContact.props.list.options({ auth: { type: 'OAUTH2', access_token: 't' } }, Object.create(null));
    expect(options.options).toEqual([{ label: 'A', value: LIST_A }, { label: 'B', value: LIST_B }]);
    expect(seen[0].query.get('limit')).toBe('500');
    expect(seen[1].query.get('cursor')).toBe('bmV4dA==');
  });

  test('list dropdown shows the error instead of an empty list', async () => {
    route({ routes: { 'GET /v3/contact_lists': { status: 401, body: { error_key: 'unauthorized', error_message: 'Unauthorized' } } } });
    const options = await createOrUpdateContact.props.list.options({ auth: { type: 'OAUTH2', access_token: 't' } }, Object.create(null));
    expect(options.disabled).toBe(true);
    expect(options.placeholder).toContain('Could not load lists');
  });
});

describe('find_contact', () => {
  test('returns found false on no match instead of failing', async () => {
    route({ routes: { 'GET /v3/contacts': { status: 200, body: { contacts: [] } } } });
    expect(await findContact.run(ctx({ propsValue: { email: 'nobody@example.com' } }))).toEqual({ found: false, contact: null });
  });

  test('ignores a non-exact hit and returns found false', async () => {
    route({ routes: { 'GET /v3/contacts': { status: 200, body: { contacts: [FULL_CONTACT] } } } });
    expect(await findContact.run(ctx({ propsValue: { email: 'doe@example.com' } }))).toEqual({ found: false, contact: null });
  });

  test('list dropdown without a connection is disabled and calls nothing', async () => {
    const seen = route({ routes: {} });
    const options = await createOrUpdateContact.props.list.options({ auth: undefined }, Object.create(null));
    expect(options.disabled).toBe(true);
    expect(seen).toHaveLength(0);
  });

  test('invalid custom fields JSON is refused before calling the API', async () => {
    const seen = route({ routes: {} });
    await expect(createOrUpdateContact.run(ctx({ propsValue: { list: [LIST_A], email_address: 'a@b.co', custom_fields_json: '{not json' } }))).rejects.toThrow(
      'JSON object keyed by custom field ID',
    );
    await expect(createOrUpdateContact.run(ctx({ propsValue: { list: [LIST_A], email_address: 'a@b.co', custom_fields_json: { Tier: 'Gold' } } }))).rejects.toThrow(
      'is not a custom field ID',
    );
    expect(seen).toHaveLength(0);
  });

  test('returns the matching contact with includes', async () => {
    const seen = route({ routes: { 'GET /v3/contacts': { status: 200, body: { contacts: [FULL_CONTACT] } } } });
    expect(await findContact.run(ctx({ propsValue: { email: 'jane.doe@example.com' } }))).toEqual({ found: true, contact: FULL_CONTACT });
    expect(seen[0].query.get('include')).toContain('list_memberships');
  });
});

describe('update_contact', () => {
  test('GET-merge-PUT keeps memberships and permission, then returns the fresh contact', async () => {
    const seen = route({
      routes: {
        [`GET /v3/contacts/${CONTACT_ID}`]: { status: 200, body: FULL_CONTACT },
        [`PUT /v3/contacts/${CONTACT_ID}`]: { status: 200, body: { contact_id: CONTACT_ID } },
      },
    });
    const result = await updateContact.run(ctx({ propsValue: { contact: CONTACT_ID, job_title: 'CEO', custom_fields: {} } }));
    const put = seen.find((call) => call.key.startsWith('PUT'));
    expect(put?.body).toEqual({
      email_address: { address: 'jane.doe@example.com', permission_to_send: 'explicit' },
      first_name: 'Jane',
      last_name: 'Doe',
      job_title: 'CEO',
      company_name: 'Example Co',
      update_source: 'Account',
    });
    expect(result).toEqual(FULL_CONTACT);
  });

  test('refuses an update with nothing to change', async () => {
    route({ routes: {} });
    await expect(updateContact.run(ctx({ propsValue: { contact: CONTACT_ID } }))).rejects.toThrow('at least one field');
  });
});

describe('list, tag and delete actions', () => {
  test('add to list resolves the email and runs one activity', async () => {
    const seen = route({
      routes: {
        'GET /v3/contacts': { status: 200, body: { contacts: [FULL_CONTACT] } },
        'POST /v3/activities/add_list_memberships': { status: 201, body: ACTIVITY },
      },
    });
    expect(await addContactToList.run(ctx({ propsValue: { contact: 'jane.doe@example.com', list: LIST_B } }))).toEqual(ACTIVITY);
    expect(seen[1].body).toEqual({ source: { contact_ids: [CONTACT_ID] }, list_ids: [LIST_B] });
  });

  test('remove from list and add tag use their own endpoints', async () => {
    const seen = route({
      routes: {
        [`GET /v3/contacts/${CONTACT_ID}`]: { status: 200, body: FULL_CONTACT },
        'POST /v3/activities/remove_list_memberships': { status: 201, body: ACTIVITY },
        'POST /v3/activities/contacts_taggings_add': { status: 201, body: ACTIVITY },
      },
    });
    await removeContactFromList.run(ctx({ propsValue: { contact: CONTACT_ID, list: LIST_A } }));
    await addTagToContact.run(ctx({ propsValue: { contact: CONTACT_ID, tag: TAG_A } }));
    expect(seen.map((call) => call.key)).toEqual([
      `GET /v3/contacts/${CONTACT_ID}`,
      'POST /v3/activities/remove_list_memberships',
      `GET /v3/contacts/${CONTACT_ID}`,
      'POST /v3/activities/contacts_taggings_add',
    ]);
    expect(seen[3].body).toEqual({ source: { contact_ids: [CONTACT_ID] }, tag_ids: [TAG_A] });
  });

  test.each([
    ['add_contact_to_list', () => addContactToList.run(ctx({ propsValue: { contact: CONTACT_ID, list: LIST_A } }))],
    ['remove_contact_from_list', () => removeContactFromList.run(ctx({ propsValue: { contact: CONTACT_ID, list: LIST_A } }))],
    ['add_tag_to_contact', () => addTagToContact.run(ctx({ propsValue: { contact: CONTACT_ID, tag: TAG_A } }))],
  ])('%s fails on an unknown contact ID instead of reporting an empty activity', async (_name, run) => {
    const seen = route({ routes: { [`GET /v3/contacts/${CONTACT_ID}`]: { status: 404, body: [{ error_key: 'contacts.api.not.found', error_message: 'Contact not found' }] } } });
    await expect(run()).rejects.toThrow(/check contact failed \(HTTP 404/);
    expect(seen.some((call) => call.key.startsWith('POST'))).toBe(false);
  });

  test('a deleted contact ID is refused before the activity', async () => {
    const seen = route({ routes: { [`GET /v3/contacts/${CONTACT_ID}`]: { status: 200, body: { ...FULL_CONTACT, deleted_at: '2026-11-11' } } } });
    await expect(addContactToList.run(ctx({ propsValue: { contact: CONTACT_ID, list: LIST_A } }))).rejects.toThrow(`contact ${CONTACT_ID} is deleted`);
    expect(seen).toHaveLength(1);
  });

  test('delete returns the id after a 204', async () => {
    route({ routes: { [`DELETE /v3/contacts/${CONTACT_ID}`]: { status: 204 } } });
    expect(await deleteContact.run(ctx({ propsValue: { contact: CONTACT_ID } }))).toEqual({ contact_id: CONTACT_ID, deleted: true });
  });
});

describe('outputSchemas against vendor-shaped fixtures (swagger examples, not live captures)', () => {
  test.each([
    ['find_contact', findContact.outputSchema, { found: true, contact: FULL_CONTACT }],
    ['update_contact', updateContact.outputSchema, FULL_CONTACT],
    ['add_contact_to_list', addContactToList.outputSchema, ACTIVITY],
    ['create_or_update_contact', createOrUpdateContact.outputSchema, { contact_id: CONTACT_ID, action: 'created' }],
    ['delete_contact', deleteContact.outputSchema, { contact_id: CONTACT_ID, deleted: true }],
  ])('%s', (_name, schema, value) => {
    const result = scoreSchema({ fields: schema?.fields ?? [], value, path: '' });
    expect(result.unmodelled).toEqual([]);
    expect(result.dead.filter((field) => !OPTIONAL_FIELDS.some((optional) => field.endsWith(optional)))).toEqual([]);
  });
});

function scoreSchema({ fields, value, path }: { fields: OutputSchema['fields']; value: unknown; path: string }): { dead: string[]; unmodelled: string[] } {
  if (Array.isArray(value)) {
    const results = value.map((item) => scoreSchema({ fields, value: item, path }));
    return { dead: results.flatMap((r) => r.dead), unmodelled: results.flatMap((r) => r.unmodelled) };
  }
  if (typeof value !== 'object' || value === null) {
    return { dead: [], unmodelled: [] };
  }
  const record = Object.fromEntries(Object.entries(value));
  const known = new Set(fields.map((field) => field.value ?? field.key));
  const nested = fields.map((field) => {
    const key = field.value ?? field.key;
    const here = path === '' ? key : `${path}.${key}`;
    if (!(key in record)) {
      return { dead: [here], unmodelled: [] };
    }
    const inner = field.children ?? field.listItems;
    return inner ? scoreSchema({ fields: inner, value: record[key], path: here }) : { dead: [], unmodelled: [] };
  });
  return {
    dead: nested.flatMap((r) => r.dead),
    unmodelled: [...Object.keys(record).filter((key) => !known.has(key)).map((key) => (path === '' ? key : `${path}.${key}`)), ...nested.flatMap((r) => r.unmodelled)],
  };
}

const OPTIONAL_FIELDS = ['deleted_at', 'opt_out_source', 'opt_out_date', 'opt_out_reason', 'started_at', 'completed_at', 'list_count', 'anniversary', 'birthday_month', 'birthday_day'];

const FULL_CONTACT = {
  contact_id: '1618ae62-4752-11e9-9c8a-fa163e6b01c1',
  email_address: {
    address: 'jane.doe@example.com',
    permission_to_send: 'explicit',
    created_at: '2026-11-01T10:00:00Z',
    updated_at: '2026-11-01T10:00:00Z',
    opt_in_source: 'Account',
    opt_in_date: '2026-11-01T10:00:00Z',
    confirm_status: 'off',
  },
  first_name: 'Jane',
  last_name: 'Doe',
  job_title: 'Owner',
  company_name: 'Example Co',
  create_source: 'Account',
  update_source: 'Account',
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T10:00:00Z',
  phone_numbers: [
    { phone_number_id: 'a2b3c4d5-0000-11e9-9c8a-fa163e6b01c1', phone_number: '+1 555 0100', kind: 'mobile', created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-01T10:00:00Z' },
  ],
  street_addresses: [
    { street_address_id: 'b2b3c4d5-0000-11e9-9c8a-fa163e6b01c1', kind: 'home', street: '1 Main St', city: 'Town', state: 'MA', postal_code: '02451', country: 'United States', created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-01T10:00:00Z' },
  ],
  custom_fields: [{ custom_field_id: '2618ae62-4752-11e9-9c8a-fa163e6b01c1', value: 'Gold' }],
  list_memberships: ['07936f78-662a-11eb-af0a-fa163e56c9b0'],
  taggings: ['c6915956-fde3-4081-977e-c3b8d1b068a7'],
};

const ACTIVITY = {
  activity_id: 'a4d1e5a0-1234-11ea-a1cb-fa163e56c9b0',
  state: 'completed',
  created_at: '2026-11-01T10:00:00Z',
  updated_at: '2026-11-01T10:00:02Z',
  started_at: '2026-11-01T10:00:01Z',
  completed_at: '2026-11-01T10:00:02Z',
  percent_done: 100,
  activity_errors: [],
  status: { items_total_count: 1, items_completed_count: 1, list_count: 1 },
};



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

function ctx({ propsValue, store }: { propsValue: Record<string, unknown>; store?: unknown }) {
  return Object.assign(Object.create(null), {
    auth: { type: 'OAUTH2', access_token: 'test-token' },
    propsValue,
    store,
  });
}


const CONTACT_ID = '1618ae62-4752-11e9-9c8a-fa163e6b01c1';
const LIST_A = '07936f78-662a-11eb-af0a-fa163e56c9b0';
const LIST_B = '17936f78-662a-11eb-af0a-fa163e56c9b0';
const TAG_A = 'c6915956-fde3-4081-977e-c3b8d1b068a7';
const FIELD_A = '2618ae62-4752-11e9-9c8a-fa163e6b01c1';

type Reply = { status: number; body?: unknown };

type Seen = {
  key: string;
  url: URL;
  query: URLSearchParams;
  body: unknown;
  authorization: string | null;
  redirect: RequestRedirect | undefined;
};
