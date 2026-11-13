import { afterEach, describe, expect, test, vi } from 'vitest';
import { OutputSchema, PropertyType } from '@activepieces/pieces-framework';
import { activecampaign } from '../src/index';
import { activecampaignCommon } from '../src/lib/common';
import { createContactAction } from '../src/lib/actions/contacts/create-contact';
import { updateContactAction } from '../src/lib/actions/contacts/update-contact';
import { addTagToContactAction } from '../src/lib/actions/contacts/add-tag-to-contact';
import { addContactToAccountAction } from '../src/lib/actions/contacts/add-contact-to-account';
import { createAccountAction } from '../src/lib/actions/accounts/create-account';
import { updateAccountAction } from '../src/lib/actions/accounts/update-account';
import { subscribeOrUnsubscribeContactFromListAction } from '../src/lib/actions/contacts/subscribe-or-unsubscribe-contact-from-list';
import { findContactAction } from '../src/lib/actions/contacts/find-contact';
import { removeTagFromContactAction } from '../src/lib/actions/contacts/remove-tag-from-contact';
import { addContactToAutomationAction } from '../src/lib/actions/contacts/add-contact-to-automation';
import { createDealAction } from '../src/lib/actions/deals/create-deal';
import { updateDealAction } from '../src/lib/actions/deals/update-deal';
import { createNoteAction } from '../src/lib/actions/notes/create-note';
import { createTaskAction } from '../src/lib/actions/tasks/create-task';

afterEach(() => vi.unstubAllGlobals());

const AUTH = { type: 'CUSTOM_AUTH', props: { apiUrl: 'https://acme.api-us1.com', apiKey: 'key' } };

describe('piece registration', () => {
  test('the 7 original actions keep their names and are human-only', () => {
    const originals = [
      'activecampaign_create_contact',
      'activecampaign_update_contact',
      'activecampaign_add_tag_to_contact',
      'activecampaign_add_contact_to_account',
      'activecampaign_create_account',
      'activecampaign_update_account',
      'activecampaign_subscribe_or_unsubscribe_contact_from_list',
    ];
    const actions = activecampaign.actions();
    for (const name of originals) {
      expect(actions[name]?.audience).toBe('human');
    }
    expect(Object.values(actions).filter((action) => action.audience === 'both')).toEqual([]);
    expect(Object.keys(actions)).toHaveLength(7 + 7 + 31);
    expect(activecampaign.minimumSupportedRelease).toBe('0.86.4');
  });

  test('13 triggers are registered, including the two formerly dead ones', () => {
    const triggers = Object.keys(activecampaign.triggers());
    expect(triggers).toHaveLength(13);
    expect(triggers).toEqual(
      expect.arrayContaining([
        'activecampaign_campaign_link_clicked',
        'activecampaign_new_campaign_bounce',
        'activecampaign_new_contact_subscribed',
        'activecampaign_contact_unsubscribed',
      ]),
    );
  });
});

describe('original actions keep their request and return shape', () => {
  test('create contact returns the raw body', async () => {
    const body = { contact: { id: '9', email: 'a@b.co' }, fieldValues: [] };
    const seen = route({ 'POST /api/3/contacts': { status: 201, body } });
    const result = await createContactAction.run(ctx({ email: 'a@b.co', firstName: 'A', contactCustomFields: { '3': 'Gold' } }));
    expect(result).toEqual(body);
    expect(seen[0].body).toEqual({ contact: { email: 'a@b.co', firstName: 'A', fieldValues: [{ field: '3', value: 'Gold' }] } });
  });

  test('update contact', async () => {
    const body = { contact: { id: '9' } };
    const seen = route({ 'PUT /api/3/contacts/9': { status: 200, body } });
    expect(await updateContactAction.run(ctx({ contactId: '9', phone: '1', contactCustomFields: {} }))).toEqual(body);
    expect(seen[0].body).toEqual({ contact: { phone: '1', fieldValues: [] } });
  });

  test('add tag to contact', async () => {
    const body = { contactTag: { id: '70' }, contacts: [] };
    const seen = route({ 'POST /api/3/contactTags': { status: 201, body } });
    expect(await addTagToContactAction.run(ctx({ contactId: '9', tagId: '5' }))).toEqual(body);
    expect(seen[0].body).toEqual({ contactTag: { contact: '9', tag: '5' } });
  });

  test('add contact to account sends numbers as before', async () => {
    const body = { accountContact: { id: '1' } };
    const seen = route({ 'POST /api/3/accountContacts': { status: 201, body } });
    expect(await addContactToAccountAction.run(ctx({ contactId: '9', accountId: '2', jobTitle: 'CEO' }))).toEqual(body);
    expect(seen[0].body).toEqual({ accountContact: { contact: 9, account: 2, jobTitle: 'CEO' } });
  });

  test('create and update account', async () => {
    const body = { account: { id: '2' } };
    const seen = route({ 'POST /api/3/accounts': { status: 201, body }, 'PUT /api/3/accounts/2': { status: 200, body } });
    expect(await createAccountAction.run(ctx({ name: 'Acme', accountCustomFields: { '4': 'x' } }))).toEqual(body);
    expect(seen[0].body).toEqual({ account: { name: 'Acme', fields: [{ customFieldId: 4, fieldValue: 'x' }] } });
    expect(await updateAccountAction.run(ctx({ accountId: '2', name: 'Acme 2', accountCustomFields: {} }))).toEqual(body);
    expect(seen[1].body).toEqual({ account: { name: 'Acme 2', fields: [] } });
  });

  test('subscribe or unsubscribe keeps the 1/2 status values', async () => {
    const body = { contactList: { id: '3' }, contacts: [] };
    const seen = route({ 'POST /api/3/contactLists': { status: 201, body } });
    expect(await subscribeOrUnsubscribeContactFromListAction.run(ctx({ listId: '1', status: '2', contactId: '9' }))).toEqual(body);
    expect(seen[0].body).toEqual({ contactList: { list: '1', contact: '9', status: '2' } });
  });
});

describe('human outputSchemas against the live raw bodies', () => {
  const inputDependent: Record<string, string[]> = { create_account: ['account.accountUrl'], create_task_human: ['dealTask.note'], update_deal_human: ['dealGroups'] };

  test.each(Object.keys(CAPTURED_HUMAN_OUTPUTS))('%s: every top-level key is modelled and no modelled field is dead', (capture) => {
    const { action: name, output } = CAPTURED_HUMAN_OUTPUTS[capture];
    const fields = activecampaign.actions()[name]?.outputSchema?.fields ?? [];
    const result = scoreSchema({ fields, value: output, path: '' });
    expect(result.dead.filter((field) => !(inputDependent[capture] ?? []).includes(field))).toEqual([]);
    expect(result.unmodelled.filter((field) => !field.includes('.'))).toEqual([]);
  });

  test('all 14 captured human actions are scored and the fixtures are sanitised', () => {
    expect(Object.keys(CAPTURED_HUMAN_OUTPUTS)).toHaveLength(14);
    expect(Object.keys(CAPTURED_HUMAN_OUTPUTS)).toEqual(expect.arrayContaining(['add_contact_to_account', 'create_deal_human', 'update_deal_human', 'add_contact_to_automation_human']));
    const text = JSON.stringify(CAPTURED_HUMAN_OUTPUTS);
    expect(text).not.toContain('activepieces95886');
    expect(CAPTURED_HUMAN_OUTPUTS['create_deal_human'].output).toMatchObject({ dealGroups: [{ title: 'Sales Pipeline' }] });
    expect(text).not.toMatch(/@(?!example\.com)[a-z0-9.-]+\.[a-z]+/i);
  });

  test('raw-body schemas say they are partial', () => {
    const actions = activecampaign.actions();
    for (const name of ['activecampaign_add_contact_to_account', 'activecampaign_create_contact', 'activecampaign_find_contact', 'activecampaign_create_account', 'activecampaign_create_note_human', 'activecampaign_create_task_human', 'activecampaign_subscribe_or_unsubscribe_contact_from_list', 'activecampaign_create_deal_human', 'activecampaign_update_deal_human', 'activecampaign_add_contact_to_automation_human']) {
      expect(JSON.stringify(actions[name]?.outputSchema)).toContain('Partial view');
    }
  });
});

describe('new human actions', () => {
  test('find contact', async () => {
    const contact = { id: '9', email: 'a@b.co' };
    route({ 'GET /api/3/contacts': { status: 200, body: { contacts: [contact] } } });
    expect(await findContactAction.run(ctx({ email: 'A@b.co ' }))).toEqual({ found: true, contact });
    route({ 'GET /api/3/contacts': { status: 200, body: { contacts: [] } } });
    expect(await findContactAction.run(ctx({ email: 'x@b.co' }))).toEqual({ found: false, contact: null });
  });

  test('remove tag from contact (human)', async () => {
    route({ 'GET /api/3/contacts/9/contactTags': { status: 200, body: { contactTags: [], meta: { total: '0' } } } });
    expect(await removeTagFromContactAction.run(ctx({ contactId: '9', tagId: '5' }))).toEqual({ removed: false, contactId: '9', tagId: '5' });
  });

  test('add contact to automation (human)', async () => {
    const seen = route({ 'POST /api/3/contactAutomations': { status: 201, body: { contactAutomation: { id: '50' } } } });
    expect(await addContactToAutomationAction.run(ctx({ contactId: '9', automationId: '3' }))).toEqual({ contactAutomation: { id: '50' } });
    expect(seen[0].body).toEqual({ contactAutomation: { contact: '9', automation: '3' } });
  });

  test('create deal (human)', async () => {
    const seen = route({ 'POST /api/3/deals': { status: 201, body: { deal: { id: '8' } } } });
    await createDealAction.run(ctx({ title: 'T', value: '1234.5', currency: 'usd', pipelineId: '1', stageId: '4', ownerId: '2', contactId: '9' }));
    expect(seen[0].body).toEqual({ deal: { title: 'T', value: 123450, currency: 'usd', group: '1', stage: '4', owner: '2', contact: '9' } });
  });

  test('create deal (human) needs a contact or an account before any request', async () => {
    const seen = route({ 'POST /api/3/deals': { status: 201, body: { deal: { id: '8' } } } });
    await expect(createDealAction.run(ctx({ title: 'T', value: '1', currency: 'usd', pipelineId: '1', stageId: '4' }))).rejects.toThrow('Choose a Contact, an Account or both');
    expect(seen).toHaveLength(0);
    await createDealAction.run(ctx({ title: 'T', value: '1', currency: 'usd', pipelineId: '1', stageId: '4', accountId: '5' }));
    expect(seen[0].body).toMatchObject({ deal: { account: '5' } });
  });

  test('create deal (human) accepts the status codes 0, 1 and 2 as well as open, won and lost', async () => {
    const seen = route({ 'POST /api/3/deals': { status: 201, body: { deal: { id: '8' } } } });
    for (const status of ['0', '1', '2', 'open', 'won', 'lost']) {
      await createDealAction.run(ctx({ title: 'T', value: '99', currency: 'usd', pipelineId: '1', stageId: '1', ownerId: '1', accountId: '5', status }));
    }
    expect(seen.map((request) => request.body)).toEqual([0, 1, 2, 0, 1, 2].map((status) => ({ deal: { title: 'T', value: 9900, currency: 'usd', group: '1', stage: '1', owner: '1', account: '5', status } })));
    await expect(createDealAction.run(ctx({ title: 'T', value: '99', currency: 'usd', pipelineId: '1', stageId: '1', accountId: '5', status: 'closed' }))).rejects.toThrow('Status must be open, won or lost');
  });

  test('create and update deal (human) explain a pipeline that needs an owner', async () => {
    const body = { errors: [{ title: 'The provided pipeline does not support auto-assigning deal owners. The deal owner id needs to be provided.' }] };
    route({ 'POST /api/3/deals': { status: 422, body }, 'PUT /api/3/deals/8': { status: 422, body } });
    await expect(createDealAction.run(ctx({ title: 'T', value: '99', currency: 'usd', pipelineId: '1', stageId: '1', contactId: '9' }))).rejects.toThrow(
      'This pipeline does not auto-assign owners: choose an Owner.',
    );
    await expect(updateDealAction.run(ctx({ dealId: '8', pipelineId: '2' }))).rejects.toThrow('This pipeline does not auto-assign owners: choose an Owner.');
  });

  test('update deal (human)', async () => {
    const seen = route({ 'PUT /api/3/deals/8': { status: 200, body: { deal: { id: '8' } } } });
    await updateDealAction.run(ctx({ dealId: '8', status: 'lost' }));
    expect(seen[0].body).toEqual({ deal: { status: 2 } });
  });

  test('add note (human)', async () => {
    const seen = route({ 'POST /api/3/notes': { status: 201, body: { note: { id: '3' } } } });
    await createNoteAction.run(ctx({ recordType: 'Deal', recordId: '8', note: 'Hi' }));
    expect(seen[0].body).toEqual({ note: { note: 'Hi', reltype: 'Deal', relid: '8' } });
  });

  test('create task (human)', async () => {
    const seen = route({ 'POST /api/3/dealTasks': { status: 201, body: { dealTask: { id: '11' } } } });
    await createTaskAction.run(ctx({ ownerType: 'contact', recordId: '9', taskTypeId: '1', dueDate: '2026-03-01T09:00:00.000Z' }));
    expect(seen[0].body).toEqual({ dealTask: { ownerType: 'contact', relid: '9', dealTasktype: '1', duedate: '2026-03-01T09:00:00.000Z' } });
  });
});

describe('human create task dates', () => {
  test('due and end dates are text props, so the engine passes a date-only value through unchanged', () => {
    expect(createTaskAction.props.dueDate.type).toBe(PropertyType.SHORT_TEXT);
    expect(createTaskAction.props.endDate.type).toBe(PropertyType.SHORT_TEXT);
  });

  test('a mapped date-only due date is sent as noon UTC', async () => {
    const seen = route({ 'POST /api/3/dealTasks': { status: 201, body: { dealTask: { id: '11' } } } });
    await createTaskAction.run(ctx({ ownerType: 'contact', recordId: '9', taskTypeId: '1', dueDate: '2026-11-25', endDate: '2026-11-26' }));
    expect(seen[0].body).toMatchObject({ dealTask: { duedate: '2026-11-25T12:00:00.000Z', edate: '2026-11-26T12:00:00.000Z' } });
  });

  test('a date-time keeps its time and offset; no offset means UTC', async () => {
    const seen = route({ 'POST /api/3/dealTasks': { status: 201, body: { dealTask: { id: '11' } } } });
    await createTaskAction.run(ctx({ ownerType: 'contact', recordId: '9', taskTypeId: '1', dueDate: '2026-11-25T09:00:00-06:00' }));
    await createTaskAction.run(ctx({ ownerType: 'contact', recordId: '9', taskTypeId: '1', dueDate: '2026-11-25T09:30' }));
    expect(seen.map((request) => request.body)).toEqual([
      { dealTask: { ownerType: 'contact', relid: '9', dealTasktype: '1', duedate: '2026-11-25T15:00:00.000Z' } },
      { dealTask: { ownerType: 'contact', relid: '9', dealTasktype: '1', duedate: '2026-11-25T09:30:00.000Z' } },
    ]);
  });

  test('a bad or reversed date fails before any request', async () => {
    const seen = route({ 'POST /api/3/dealTasks': { status: 201, body: { dealTask: { id: '11' } } } });
    await expect(createTaskAction.run(ctx({ ownerType: 'contact', recordId: '9', taskTypeId: '1', dueDate: '25/11/2026' }))).rejects.toThrow('Due Date must be an ISO 8601 date');
    await expect(createTaskAction.run(ctx({ ownerType: 'contact', recordId: '9', taskTypeId: '1', dueDate: '2026-02-30' }))).rejects.toThrow('Due Date must be an ISO 8601 date');
    await expect(createTaskAction.run(ctx({ ownerType: 'contact', recordId: '9', taskTypeId: '1', dueDate: '2026-11-25', endDate: '2026-11-24' }))).rejects.toThrow('End Date must not be before Due Date');
    expect(seen).toHaveLength(0);
  });
});

describe('dropdowns', () => {
  test('contact dropdown searches server-side and says when more exist', async () => {
    const seen = route({
      'GET /api/3/contacts': { status: 200, body: { contacts: [{ id: '9', email: 'jane@x.co', firstName: 'Jane', lastName: 'Doe' }], meta: { total: '250' } } },
    });
    const state = await activecampaignCommon.contactId.options({ auth: AUTH }, Object.assign(Object.create(null), { searchValue: 'jane' }));
    expect(state.options).toEqual([{ label: 'Jane Doe (jane@x.co)', value: '9' }]);
    expect(state.placeholder).toContain('Showing 1 of 250');
    expect(seen[0].query.get('search')).toBe('jane');
    expect(seen[0].query.get('limit')).toBe('100');
  });

  test('list dropdown filters by name', async () => {
    const seen = route({ 'GET /api/3/lists': { status: 200, body: { lists: [{ id: '1', name: 'News' }], meta: { total: '1' } } } });
    await activecampaignCommon.listId(true).options({ auth: AUTH }, Object.assign(Object.create(null), { searchValue: 'Ne' }));
    expect(seen[0].query.get('filters[name]')).toBe('Ne');
  });

  test('an API error disables the dropdown with the reason', async () => {
    route({ 'GET /api/3/tags': { status: 403, body: { message: 'You do not have permission' } } });
    const state = await activecampaignCommon.tagId.options({ auth: AUTH }, Object.assign(Object.create(null), {}));
    expect(state).toMatchObject({ disabled: true, options: [] });
    expect(state.placeholder).toContain('(403): You do not have permission');
  });

  test('stage dropdown waits for a pipeline', async () => {
    const seen = route({});
    const state = await activecampaignCommon.stageId(true).options({ auth: AUTH }, Object.assign(Object.create(null), {}));
    expect(state).toMatchObject({ disabled: true, placeholder: 'Select a pipeline first' });
    expect(seen).toHaveLength(0);
  });
});

function ctx(propsValue: Record<string, unknown>) {
  return Object.assign(Object.create(null), { auth: AUTH, propsValue });
}

function route(routes: Record<string, { status: number; body: unknown }>): Seen[] {
  const seen: Seen[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      const key = `${init?.method ?? 'GET'} ${url.pathname}`;
      seen.push({ key, query: url.searchParams, body: typeof init?.body === 'string' ? JSON.parse(init.body) : null });
      const reply = routes[key];
      if (!reply) {
        return new Response(JSON.stringify({ message: `unexpected ${key}` }), { status: 599 });
      }
      return new Response(JSON.stringify(reply.body), { status: reply.status });
    }),
  );
  return seen;
}

type Seen = { key: string; query: URLSearchParams; body: unknown };

function scoreSchema({ fields, value, path }: { fields: OutputSchema['fields']; value: unknown; path: string }): { dead: string[]; unmodelled: string[] } {
  if (Array.isArray(value)) {
    const results = value.map((item) => scoreSchema({ fields, value: item, path: `${path}[]` }));
    return { dead: results.flatMap((r) => r.dead), unmodelled: results.flatMap((r) => r.unmodelled) };
  }
  if (typeof value !== 'object' || value === null) {
    return { dead: [], unmodelled: [] };
  }
  const record = Object.fromEntries(Object.entries(value));
  const known = new Set(fields.map((field) => field.value ?? field.key));
  const nested = fields.map((field) => {
    const key = field.value ?? field.key;
    const here = `${path}${path === '' || path.endsWith('.') ? '' : '.'}${key}`;
    if (!(key in record)) {
      return { dead: [here], unmodelled: [] };
    }
    if (field.dynamicKey) {
      return { dead: [], unmodelled: [] };
    }
    const inner = field.children ?? field.listItems;
    return inner ? scoreSchema({ fields: inner, value: record[key], path: `${here}.` }) : { dead: [], unmodelled: [] };
  });
  const prefix = path === '' || path.endsWith('.') ? path : `${path}.`;
  return {
    dead: nested.flatMap((r) => r.dead),
    unmodelled: [...Object.keys(record).filter((key) => !known.has(key)).map((key) => `${prefix}${key}`), ...nested.flatMap((r) => r.unmodelled)],
  };
}

const CAPTURED_HUMAN_OUTPUTS: Record<string, { action: string; output: unknown }> = {
  "add_contact_to_account": {
    "action": "activecampaign_add_contact_to_account",
    "output": {
      "accounts": [
        {
          "name": "AP QA Corp",
          "accountUrl": "https://example.org",
          "createdTimestamp": "2026-11-08T01:31:19-06:00",
          "updatedTimestamp": "2026-11-08T01:51:43-06:00",
          "owner": "1",
          "links": {},
          "id": "1"
        }
      ],
      "accountContact": {
        "contact": 7,
        "account": 1,
        "jobTitle": "QA",
        "createdTimestamp": "2026-11-08T01:51:43-06:00",
        "updatedTimestamp": "2026-11-08T01:51:43-06:00",
        "links": {},
        "id": "4"
      }
    }
  },
  "add_contact_to_automation_human": {
    "action": "activecampaign_add_contact_to_automation_human",
    "output": {
      "contacts": [
        {
          "cdate": "2026-11-08T01:32:16-06:00",
          "email": "apqa2@example.com",
          "phone": "",
          "firstName": "QA",
          "lastName": "Two-Upd",
          "orgid": "2",
          "orgname": "AP QA Two Upd",
          "segmentio_id": "",
          "bounced_hard": "0",
          "bounced_soft": "0",
          "bounced_date": null,
          "ip": "0",
          "ua": "",
          "hash": "c349b380ccbf135e9aec6efd53eaaf1d",
          "socialdata_lastcheck": null,
          "email_local": "",
          "email_domain": "example.com",
          "sentcnt": "0",
          "rating_tstamp": null,
          "gravatar": "0",
          "deleted": "0",
          "anonymized": "0",
          "adate": null,
          "udate": "2026-11-08T01:47:16-06:00",
          "edate": null,
          "deleted_at": null,
          "created_utc_timestamp": "2026-11-08 01:32:16",
          "updated_utc_timestamp": "2026-11-08 01:47:16",
          "created_timestamp": "2026-11-08 01:32:16",
          "updated_timestamp": "2026-11-08 01:47:16",
          "created_by": "0",
          "updated_by": "0",
          "mpp_tracking": "0",
          "last_click_date": null,
          "last_open_date": null,
          "last_mpp_open_date": null,
          "best_send_hour": "0",
          "sms_consent": "0",
          "sms_consent_updated_at": "0000-00-00 00:00:00",
          "whatsapp_id": null,
          "whatsapp_username": null,
          "links": {},
          "id": "3",
          "organization": "2"
        }
      ],
      "contactAutomation": {
        "contact": "3",
        "seriesid": "1",
        "startid": 0,
        "status": 1,
        "batchid": "82c6b1de-08d8-4176-8fa8-bd1d8c30e82d",
        "lastblock": "1",
        "in_als": 3,
        "completedElements": 1,
        "totalElements": 5,
        "completed": 0,
        "completeValue": 20,
        "links": {},
        "id": "3",
        "automation": "1"
      }
    }
  },
  "add_tag_to_contact": {
    "action": "activecampaign_add_tag_to_contact",
    "output": {
      "tags": [
        {
          "tagType": "contact",
          "tag": "ap-qa-tag",
          "description": "qa",
          "subscriber_count": "2",
          "cdate": "2026-11-08T01:30:39-06:00",
          "created_timestamp": "2026-11-08 01:30:39",
          "updated_timestamp": "2026-11-08 01:47:05",
          "created_by": null,
          "updated_by": null,
          "deleted": "0",
          "links": {},
          "id": "1"
        }
      ],
      "contacts": [
        {
          "cdate": "2026-11-08T01:32:16-06:00",
          "email": "apqa2@example.com",
          "phone": "",
          "firstName": "QA",
          "lastName": "Two-Upd",
          "orgid": "2",
          "orgname": "AP QA Two Upd",
          "segmentio_id": "",
          "bounced_hard": "0",
          "bounced_soft": "0",
          "bounced_date": null,
          "ip": "0",
          "ua": "",
          "hash": "c349b380ccbf135e9aec6efd53eaaf1d",
          "socialdata_lastcheck": null,
          "email_local": "",
          "email_domain": "example.com",
          "sentcnt": "0",
          "rating_tstamp": null,
          "gravatar": "0",
          "deleted": "0",
          "anonymized": "0",
          "adate": null,
          "udate": "2026-11-08T01:47:05-06:00",
          "edate": null,
          "deleted_at": null,
          "created_utc_timestamp": "2026-11-08 01:32:16",
          "updated_utc_timestamp": "2026-11-08 01:47:05",
          "created_timestamp": "2026-11-08 01:32:16",
          "updated_timestamp": "2026-11-08 01:47:05",
          "created_by": "0",
          "updated_by": "0",
          "mpp_tracking": "0",
          "last_click_date": null,
          "last_open_date": null,
          "last_mpp_open_date": null,
          "best_send_hour": "0",
          "sms_consent": "0",
          "sms_consent_updated_at": "0000-00-00 00:00:00",
          "whatsapp_id": null,
          "whatsapp_username": null,
          "links": {},
          "id": "3",
          "organization": "2"
        }
      ],
      "contactTag": {
        "contact": "3",
        "tag": "1",
        "cdate": "2026-11-08T01:47:05-06:00",
        "links": {},
        "id": "5"
      }
    }
  },
  "create_account": {
    "action": "activecampaign_create_account",
    "output": {
      "account": {
        "name": "AP QA Human",
        "createdTimestamp": "2026-11-08T01:47:11-06:00",
        "updatedTimestamp": "2026-11-08T01:47:11-06:00",
        "owner": "1",
        "links": {},
        "customFieldSaveStatus": {
          "status": "success"
        },
        "fields": [],
        "id": "4"
      }
    }
  },
  "create_contact": {
    "action": "activecampaign_create_contact",
    "output": {
      "fieldValues": [],
      "contact": {
        "email": "apqa6@example.com",
        "firstName": "Six",
        "cdate": "2026-11-08T01:47:02-06:00",
        "udate": "2026-11-08T01:47:02-06:00",
        "phone": "",
        "orgid": "0",
        "orgname": "",
        "links": {},
        "lastName": "",
        "fieldValues": [],
        "id": "7",
        "organization": null
      }
    }
  },
  "create_deal_human": {
    "action": "activecampaign_create_deal_human",
    "output": {
      "contacts": [
        {
          "cdate": "2026-11-08T01:32:16-06:00",
          "email": "apqa2@example.com",
          "phone": "",
          "firstName": "QA",
          "lastName": "Two-Upd",
          "orgid": "2",
          "orgname": "AP QA Two Upd",
          "segmentio_id": "",
          "bounced_hard": "0",
          "bounced_soft": "0",
          "bounced_date": null,
          "ip": "0",
          "ua": "",
          "hash": "c349b380ccbf135e9aec6efd53eaaf1d",
          "socialdata_lastcheck": null,
          "email_local": "",
          "email_domain": "example.com",
          "sentcnt": "0",
          "rating_tstamp": null,
          "gravatar": "0",
          "deleted": "0",
          "anonymized": "0",
          "adate": null,
          "udate": "2026-11-08T01:47:16-06:00",
          "edate": null,
          "deleted_at": null,
          "created_utc_timestamp": "2026-11-08 01:32:16",
          "updated_utc_timestamp": "2026-11-08 01:47:16",
          "created_timestamp": "2026-11-08 01:32:16",
          "updated_timestamp": "2026-11-08 01:47:16",
          "created_by": "0",
          "updated_by": "0",
          "mpp_tracking": "0",
          "last_click_date": null,
          "last_open_date": null,
          "last_mpp_open_date": null,
          "best_send_hour": "0",
          "sms_consent": "0",
          "sms_consent_updated_at": "0000-00-00 00:00:00",
          "whatsapp_id": null,
          "whatsapp_username": null,
          "links": {},
          "id": "3",
          "organization": "2"
        }
      ],
      "dealGroups": [
        {
          "title": "Sales Pipeline",
          "currency": "usd",
          "autoassign": "0",
          "allusers": "0",
          "allgroups": "1",
          "win_probability_initialize_date": null,
          "cdate": "2026-11-08T02:09:47-06:00",
          "udate": null,
          "source": "",
          "links": {},
          "id": "1"
        }
      ],
      "dealStages": [
        {
          "group": "1",
          "title": "To Contact",
          "color": "19CCA3",
          "order": "1",
          "width": "280",
          "dealOrder": "next-action DESC",
          "cardRegion1": "title",
          "cardRegion2": "next-action",
          "cardRegion3": "show-avatar",
          "cardRegion4": "contact-fullname-acctname",
          "cardRegion5": "value",
          "cdate": null,
          "udate": null,
          "links": {},
          "id": "1"
        }
      ],
      "deal": {
        "title": "QA Deal Human",
        "value": 9900,
        "currency": "usd",
        "status": 0,
        "group": "1",
        "stage": "1",
        "owner": "1",
        "contact": "3",
        "cdate": "2026-11-08T05:15:33-06:00",
        "mdate": "2026-11-08T05:15:33-06:00",
        "description": "",
        "organization": null,
        "nextdate": null,
        "nextdealid": "0",
        "hash": "33165dd5",
        "winProbability": null,
        "winProbabilityMdate": null,
        "links": {},
        "fields": [],
        "customFieldSaveStatus": {
          "status": "success"
        },
        "id": "2",
        "isDisabled": false,
        "account": null,
        "customerAccount": null
      }
    }
  },
  "create_note_human": {
    "action": "activecampaign_create_note_human",
    "output": {
      "contacts": [
        {
          "cdate": "2026-11-08T01:32:16-06:00",
          "email": "apqa2@example.com",
          "phone": "",
          "firstName": "QA",
          "lastName": "Two-Upd",
          "orgid": "2",
          "orgname": "AP QA Two Upd",
          "segmentio_id": "",
          "bounced_hard": "0",
          "bounced_soft": "0",
          "bounced_date": null,
          "ip": "0",
          "ua": "",
          "hash": "c349b380ccbf135e9aec6efd53eaaf1d",
          "socialdata_lastcheck": null,
          "email_local": "",
          "email_domain": "example.com",
          "sentcnt": "0",
          "rating_tstamp": null,
          "gravatar": "0",
          "deleted": "0",
          "anonymized": "0",
          "adate": null,
          "udate": "2026-11-08T01:47:14-06:00",
          "edate": null,
          "deleted_at": null,
          "created_utc_timestamp": "2026-11-08 01:32:16",
          "updated_utc_timestamp": "2026-11-08 01:47:14",
          "created_timestamp": "2026-11-08 01:32:16",
          "updated_timestamp": "2026-11-08 01:47:14",
          "created_by": "0",
          "updated_by": "0",
          "mpp_tracking": "0",
          "last_click_date": null,
          "last_open_date": null,
          "last_mpp_open_date": null,
          "best_send_hour": "0",
          "sms_consent": "0",
          "sms_consent_updated_at": "0000-00-00 00:00:00",
          "whatsapp_id": null,
          "whatsapp_username": null,
          "links": {},
          "id": "3",
          "organization": "2"
        }
      ],
      "note": {
        "note": "cap human note",
        "cdate": "2026-11-08T01:47:14-06:00",
        "mdate": "2026-11-08T01:47:14-06:00",
        "reltype": "Subscriber",
        "relid": "3",
        "userid": "1",
        "links": {},
        "is_draft": "",
        "owner": {
          "type": "contact",
          "id": "3"
        },
        "id": "5",
        "user": "1"
      }
    }
  },
  "create_task_human": {
    "action": "activecampaign_create_task_human",
    "output": {
      "dealTasktypes": [
        {
          "defduration": "0",
          "status": "0",
          "title": "Call",
          "cdate": null,
          "udate": null,
          "created_by": null,
          "updated_by": null,
          "created_utc_timestamp": "2026-11-05T06:00:34-06:00",
          "updated_utc_timestamp": "2026-11-05T06:00:34-06:00",
          "display_order": "0",
          "links": {},
          "id": "1"
        }
      ],
      "contacts": [
        {
          "cdate": "2026-11-08T01:32:16-06:00",
          "email": "apqa2@example.com",
          "phone": "",
          "firstName": "QA",
          "lastName": "Two-Upd",
          "orgid": "2",
          "orgname": "AP QA Two Upd",
          "segmentio_id": "",
          "bounced_hard": "0",
          "bounced_soft": "0",
          "bounced_date": null,
          "ip": "0",
          "ua": "",
          "hash": "c349b380ccbf135e9aec6efd53eaaf1d",
          "socialdata_lastcheck": null,
          "email_local": "",
          "email_domain": "example.com",
          "sentcnt": "0",
          "rating_tstamp": null,
          "gravatar": "0",
          "deleted": "0",
          "anonymized": "0",
          "adate": null,
          "udate": "2026-11-08T01:47:16-06:00",
          "edate": null,
          "deleted_at": null,
          "created_utc_timestamp": "2026-11-08 01:32:16",
          "updated_utc_timestamp": "2026-11-08 01:47:16",
          "created_timestamp": "2026-11-08 01:32:16",
          "updated_timestamp": "2026-11-08 01:47:16",
          "created_by": "0",
          "updated_by": "0",
          "mpp_tracking": "0",
          "last_click_date": null,
          "last_open_date": null,
          "last_mpp_open_date": null,
          "best_send_hour": "0",
          "sms_consent": "0",
          "sms_consent_updated_at": "0000-00-00 00:00:00",
          "whatsapp_id": null,
          "whatsapp_username": null,
          "links": {},
          "id": "3",
          "organization": "2"
        }
      ],
      "dealTask": {
        "relid": "3",
        "title": "cap human task",
        "dealTasktype": "1",
        "duedate": "2026-11-27T03:00:00-06:00",
        "cdate": "2026-11-08T01:47:16-06:00",
        "udate": "2026-11-08T01:47:16-06:00",
        "assignee": null,
        "reltype": "Subscriber",
        "automation": null,
        "doneAutomation": null,
        "user": "1",
        "edate": "2026-11-27T03:15:00-06:00",
        "assigned_date": "2026-11-08T01:47:16-06:00",
        "owner": {
          "type": "contact",
          "id": "3"
        },
        "links": {},
        "status": "",
        "triggerAutomationOnCreate": "",
        "relTitle": "QA Two-Upd",
        "id": "6"
      }
    }
  },
  "find_contact": {
    "action": "activecampaign_find_contact",
    "output": {
      "found": true,
      "contact": {
        "cdate": "2026-11-08T01:30:31-06:00",
        "email": "apqa1@example.com",
        "phone": "+15550001",
        "firstName": "QA",
        "lastName": "Trig",
        "orgid": "1",
        "orgname": "AP QA Corp",
        "segmentio_id": "",
        "bounced_hard": "0",
        "bounced_soft": "0",
        "bounced_date": null,
        "ip": "0",
        "ua": "",
        "hash": "2941a4d1e46e461696d965b14f86dd76",
        "socialdata_lastcheck": null,
        "email_local": "",
        "email_domain": "example.com",
        "sentcnt": "0",
        "rating_tstamp": null,
        "gravatar": "0",
        "deleted": "0",
        "anonymized": "0",
        "adate": null,
        "udate": "2026-11-08T01:46:53-06:00",
        "edate": null,
        "deleted_at": null,
        "created_utc_timestamp": "2026-11-08 01:30:31",
        "updated_utc_timestamp": "2026-11-08 01:46:53",
        "created_timestamp": "2026-11-08 01:30:31",
        "updated_timestamp": "2026-11-08 01:46:53",
        "created_by": "0",
        "updated_by": "0",
        "mpp_tracking": "0",
        "last_click_date": null,
        "last_open_date": null,
        "last_mpp_open_date": null,
        "best_send_hour": "0",
        "sms_consent": "0",
        "sms_consent_updated_at": "0000-00-00 00:00:00",
        "whatsapp_id": null,
        "whatsapp_username": null,
        "open_tracking_optout": "0",
        "open_tracking_optout_updated_at": null,
        "scoreValues": [],
        "accountContacts": [
          "1"
        ],
        "links": {},
        "id": "2",
        "organization": "1"
      }
    }
  },
  "remove_tag_from_contact_human": {
    "action": "activecampaign_remove_tag_from_contact_human",
    "output": {
      "removed": true,
      "contactId": "3",
      "tagId": "1"
    }
  },
  "subscribe_or_unsubscribe_contact_from_list": {
    "action": "activecampaign_subscribe_or_unsubscribe_contact_from_list",
    "output": {
      "contacts": [
        {
          "cdate": "2026-11-08T01:32:16-06:00",
          "email": "apqa2@example.com",
          "phone": "",
          "firstName": "QA",
          "lastName": "Two-Upd",
          "orgid": "2",
          "orgname": "AP QA Two Upd",
          "segmentio_id": "",
          "bounced_hard": "0",
          "bounced_soft": "0",
          "bounced_date": null,
          "ip": "0",
          "ua": "",
          "hash": "c349b380ccbf135e9aec6efd53eaaf1d",
          "socialdata_lastcheck": null,
          "email_local": "",
          "email_domain": "example.com",
          "sentcnt": "0",
          "rating_tstamp": null,
          "gravatar": "0",
          "deleted": "0",
          "anonymized": "0",
          "adate": null,
          "udate": "2026-11-08T01:47:09-06:00",
          "edate": null,
          "deleted_at": null,
          "created_utc_timestamp": "2026-11-08 01:32:16",
          "updated_utc_timestamp": "2026-11-08 01:47:09",
          "created_timestamp": "2026-11-08 01:32:16",
          "updated_timestamp": "2026-11-08 01:47:09",
          "created_by": "0",
          "updated_by": "0",
          "mpp_tracking": "0",
          "last_click_date": null,
          "last_open_date": null,
          "last_mpp_open_date": null,
          "best_send_hour": "0",
          "sms_consent": "0",
          "sms_consent_updated_at": "0000-00-00 00:00:00",
          "whatsapp_id": null,
          "whatsapp_username": null,
          "links": {},
          "id": "3",
          "organization": "2"
        }
      ],
      "contactList": {
        "contact": "3",
        "list": "3",
        "form": null,
        "seriesid": "0",
        "sdate": "2026-11-08T01:47:09-06:00",
        "udate": null,
        "status": 1,
        "responder": "1",
        "sync": "0",
        "unsubreason": "",
        "campaign": null,
        "message": null,
        "first_name": "QA",
        "last_name": "Two-Upd",
        "ip4Sub": "0",
        "sourceid": 4,
        "autosyncLog": null,
        "ip4_last": "0",
        "ip4Unsub": "0",
        "created_timestamp": "2026-11-08 01:32:25",
        "updated_timestamp": "2026-11-08 01:32:25",
        "created_by": "0",
        "updated_by": "0",
        "unsubscribeAutomation": null,
        "links": {},
        "id": "3",
        "automation": null
      }
    }
  },
  "update_account": {
    "action": "activecampaign_update_account",
    "output": {
      "account": {
        "name": "AP QA Two Upd",
        "accountUrl": "",
        "createdTimestamp": "2026-11-08T01:32:28-06:00",
        "updatedTimestamp": "2026-11-08T01:47:12-06:00",
        "owner": "1",
        "links": {},
        "customFieldSaveStatus": {
          "status": "success"
        },
        "fields": [],
        "id": "2"
      }
    }
  },
  "update_contact": {
    "action": "activecampaign_update_contact",
    "output": {
      "fieldValues": [],
      "contact": {
        "cdate": "2026-11-08T01:32:16-06:00",
        "email": "apqa2@example.com",
        "phone": "",
        "firstName": "QA",
        "lastName": "Two-Upd",
        "orgid": "2",
        "orgname": "AP QA Two Upd",
        "segmentio_id": "",
        "bounced_hard": "0",
        "bounced_soft": "0",
        "bounced_date": null,
        "ip": "0",
        "ua": "",
        "hash": "c349b380ccbf135e9aec6efd53eaaf1d",
        "socialdata_lastcheck": null,
        "email_local": "",
        "email_domain": "example.com",
        "sentcnt": "0",
        "rating_tstamp": null,
        "gravatar": "0",
        "deleted": "0",
        "anonymized": "0",
        "adate": null,
        "udate": "2026-11-08T01:47:03-06:00",
        "edate": null,
        "deleted_at": null,
        "created_utc_timestamp": "2026-11-08 01:32:16",
        "updated_utc_timestamp": "2026-11-08 01:47:03",
        "created_timestamp": "2026-11-08 01:32:16",
        "updated_timestamp": "2026-11-08 01:47:03",
        "created_by": "0",
        "updated_by": "0",
        "mpp_tracking": "0",
        "best_send_hour": "0",
        "sms_consent": "0",
        "sms_consent_updated_at": "0000-00-00 00:00:00",
        "open_tracking_optout": "0",
        "open_tracking_optout_updated_at": null,
        "links": {},
        "fieldValues": [],
        "id": "3",
        "organization": "2"
      }
    }
  },
  "update_deal_human": {
    "action": "activecampaign_update_deal_human",
    "output": {
      "contacts": [
        {
          "cdate": "2026-11-08T01:32:16-06:00",
          "email": "apqa2@example.com",
          "phone": "",
          "firstName": "QA",
          "lastName": "Two-Upd",
          "orgid": "2",
          "orgname": "AP QA Two Upd",
          "segmentio_id": "",
          "bounced_hard": "0",
          "bounced_soft": "0",
          "bounced_date": null,
          "ip": "0",
          "ua": "",
          "hash": "c349b380ccbf135e9aec6efd53eaaf1d",
          "socialdata_lastcheck": null,
          "email_local": "",
          "email_domain": "example.com",
          "sentcnt": "0",
          "rating_tstamp": null,
          "gravatar": "0",
          "deleted": "0",
          "anonymized": "0",
          "adate": null,
          "udate": "2026-11-08T01:47:16-06:00",
          "edate": null,
          "deleted_at": null,
          "created_utc_timestamp": "2026-11-08 01:32:16",
          "updated_utc_timestamp": "2026-11-08 01:47:16",
          "created_timestamp": "2026-11-08 01:32:16",
          "updated_timestamp": "2026-11-08 01:47:16",
          "created_by": "0",
          "updated_by": "0",
          "mpp_tracking": "0",
          "last_click_date": null,
          "last_open_date": null,
          "last_mpp_open_date": null,
          "best_send_hour": "0",
          "sms_consent": "0",
          "sms_consent_updated_at": "0000-00-00 00:00:00",
          "whatsapp_id": null,
          "whatsapp_username": null,
          "links": {},
          "id": "3",
          "organization": "2"
        }
      ],
      "dealStages": [
        {
          "group": "1",
          "title": "Follow Up",
          "color": "FBD965",
          "order": "3",
          "width": "280",
          "dealOrder": "next-action DESC",
          "cardRegion1": "title",
          "cardRegion2": "next-action",
          "cardRegion3": "show-avatar",
          "cardRegion4": "contact-fullname-acctname",
          "cardRegion5": "value",
          "cdate": null,
          "udate": null,
          "links": {},
          "id": "3"
        }
      ],
      "deal": {
        "hash": "33165dd5",
        "owner": "1",
        "contact": "3",
        "organization": null,
        "group": "1",
        "stage": "3",
        "title": "QA Deal Human Upd",
        "description": "",
        "percent": "0",
        "cdate": "2026-11-08T05:15:33-06:00",
        "mdate": "2026-11-08T05:15:35-06:00",
        "nextdate": null,
        "nexttaskid": null,
        "value": "9900",
        "currency": "usd",
        "status": 0,
        "activitycount": "2",
        "nextdealid": "2",
        "edate": null,
        "status_mdate": "2026-11-08 05:15:33",
        "winProbability": null,
        "winProbabilityMdate": null,
        "links": {},
        "fields": [],
        "customFieldSaveStatus": {
          "status": "success"
        },
        "id": "2",
        "isDisabled": false,
        "account": null,
        "customerAccount": null
      }
    }
  }
};
