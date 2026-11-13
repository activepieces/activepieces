import { afterEach, describe, expect, test, vi } from 'vitest';
import { OutputSchema } from '@activepieces/pieces-framework';
import { activeCampaignAiActions } from '../src/lib/actions/ai';
import { aiInput } from '../src/lib/common/ai-props';
import { listContactsAction } from '../src/lib/actions/ai/list-contacts';
import { getContactAction } from '../src/lib/actions/ai/get-contact';
import { createOrUpdateContactAiAction } from '../src/lib/actions/ai/create-or-update-contact';
import { deleteContactAction } from '../src/lib/actions/ai/delete-contact';
import { listTagsAction } from '../src/lib/actions/ai/list-tags';
import { createTagAction } from '../src/lib/actions/ai/create-tag';
import { addTagToContactAiAction } from '../src/lib/actions/ai/add-tag-to-contact';
import { removeTagFromContactAiAction } from '../src/lib/actions/ai/remove-tag-from-contact';
import { listListsAction } from '../src/lib/actions/ai/list-lists';
import { subscribeContactToListAction } from '../src/lib/actions/ai/subscribe-contact-to-list';
import { unsubscribeContactFromListAction } from '../src/lib/actions/ai/unsubscribe-contact-from-list';
import { listContactCustomFieldsAction } from '../src/lib/actions/ai/list-contact-custom-fields';
import { listAccountCustomFieldsAction } from '../src/lib/actions/ai/list-account-custom-fields';
import { listAccountsAction } from '../src/lib/actions/ai/list-accounts';
import { createAccountAiAction } from '../src/lib/actions/ai/create-account';
import { updateAccountAiAction } from '../src/lib/actions/ai/update-account';
import { associateContactWithAccountAction } from '../src/lib/actions/ai/associate-contact-with-account';
import { listPipelinesAction } from '../src/lib/actions/ai/list-pipelines';
import { listDealStagesAction } from '../src/lib/actions/ai/list-deal-stages';
import { listDealsAction } from '../src/lib/actions/ai/list-deals';
import { getDealAction } from '../src/lib/actions/ai/get-deal';
import { createDealAiAction } from '../src/lib/actions/ai/create-deal';
import { updateDealAiAction } from '../src/lib/actions/ai/update-deal';
import { createNoteAiAction } from '../src/lib/actions/ai/create-note';
import { listTaskTypesAction } from '../src/lib/actions/ai/list-task-types';
import { createTaskAiAction } from '../src/lib/actions/ai/create-task';
import { completeTaskAction } from '../src/lib/actions/ai/complete-task';
import { listAutomationsAction } from '../src/lib/actions/ai/list-automations';
import { addContactToAutomationAiAction } from '../src/lib/actions/ai/add-contact-to-automation';
import { removeContactFromAutomationAction } from '../src/lib/actions/ai/remove-contact-from-automation';
import { listUsersAction } from '../src/lib/actions/ai/list-users';
import { ActiveCampaignApiError } from '../src/lib/common/client';

afterEach(() => vi.unstubAllGlobals());

describe('AI action metadata', () => {
  test('31 ai actions, each with outputSchema, aiMetadata and no Checkbox or dynamic props', () => {
    expect(activeCampaignAiActions).toHaveLength(31);
    const names = new Set(activeCampaignAiActions.map((action) => action.name));
    expect(names.size).toBe(31);
    for (const action of activeCampaignAiActions) {
      expect(action.audience).toBe('ai');
      expect(action.outputSchema?.fields.length).toBeGreaterThan(0);
      expect(action.aiMetadata?.description).toBeTruthy();
      for (const prop of Object.values(action.props)) {
        expect(['CHECKBOX', 'DROPDOWN', 'DYNAMIC', 'MULTI_SELECT_DROPDOWN']).not.toContain(prop.type);
      }
    }
  });
});

describe('AI outputSchemas scored both ways against the live outputs', () => {
  const inputDependent: Record<string, string[]> = { create_account_ai: ['accountUrl'], create_task: ['note'], create_task_deal: ['note'] };

  test.each(Object.keys(CAPTURED_AI_OUTPUTS))('%s', (capture) => {
    const { action: name, output } = CAPTURED_AI_OUTPUTS[capture];
    const action = activeCampaignAiActions.find((candidate) => candidate.name === name);
    const result = scoreSchema({ fields: action?.outputSchema?.fields ?? [], value: output, path: '' });
    expect(result.dead.filter((field) => !(inputDependent[capture] ?? []).includes(field))).toEqual([]);
    expect(result.unmodelled).toEqual([]);
  });

  test('every captured AI action is covered and the fixtures are sanitised', () => {
    expect(Object.keys(CAPTURED_AI_OUTPUTS)).toHaveLength(41);
    const covered = new Set(Object.values(CAPTURED_AI_OUTPUTS).map((capture) => capture.action));
    expect(covered.size).toBe(31);
    expect(activeCampaignAiActions.map((action) => action.name).filter((name) => !covered.has(name))).toEqual([]);
    const text = JSON.stringify(CAPTURED_AI_OUTPUTS);
    expect(text).not.toContain('activepieces95886');
    expect(CAPTURED_AI_OUTPUTS['list_users'].output).toEqual({ items: [{ id: '1', username: 'admin', firstName: 'Alex', lastName: 'Owner', email: 'owner@example.com' }], total: 1 });
    expect(text).not.toMatch(/@(?!example\.com)[a-z0-9.-]+\.[a-z]+/i);
  });
});

describe('pipeline and stage outputSchemas scored against non-empty vendor records', () => {
  const PIPELINE = {
    id: '1', title: 'Sales Pipeline', currency: 'usd', allgroups: '0', allusers: '0', autoassign: '0',
    cdate: '2026-11-08T05:10:02-06:00', udate: '2026-11-08T05:10:02-06:00', stages: ['1', '2', '3'], users: ['1'], groups: ['3'], links: {},
  };
  const STAGE = {
    id: '2', title: 'Qualified', group: '1', order: '2', color: '32B0FC', width: '280', dealOrder: 'next-action DESC',
    cardRegion1: 'title', cardRegion2: 'next-action', cardRegion3: 'show-avatar', cardRegion4: 'contact-fullname-orgname', cardRegion5: 'value',
    cdate: '2026-11-08T05:10:02-06:00', udate: '2026-11-08T05:10:02-06:00', links: {},
  };

  test.each([
    { action: listPipelinesAction, path: '/api/3/dealGroups', key: 'dealGroups', record: PIPELINE },
    { action: listDealStagesAction, path: '/api/3/dealStages', key: 'dealStages', record: STAGE },
  ])('$key', async ({ action, path, key, record }) => {
    route({ [`GET ${path}`]: { status: 200, body: { [key]: [record, { ...record, id: '9' }], meta: { total: '2' } } } });
    const output = await action.run(ctx({}));
    const items = typeof output === 'object' && output !== null && 'items' in output && Array.isArray(output.items) ? output.items : [];
    expect(items).toHaveLength(2);
    const result = scoreSchema({ fields: action.outputSchema?.fields ?? [], value: output, path: '' });
    expect(result.dead).toEqual([]);
    expect(result.unmodelled).toEqual([]);
  });

  test('every other live list capture contains records, so its item fields are scored', () => {
    const scoredAbove = ['list_deal_stages', 'list_pipelines'];
    const emptyLists = Object.entries(CAPTURED_AI_OUTPUTS)
      .filter(([, capture]) => {
        const output = capture.output;
        return typeof output === 'object' && output !== null && 'items' in output && Array.isArray(output.items) && output.items.length === 0;
      })
      .map(([name]) => name);
    expect(emptyLists).toEqual(scoredAbove);
  });
});

describe('aiInput rules', () => {
  test.each([
    ['0.29', 29],
    ['1234.5', 123450],
    ['1500', 150000],
    ['0.1', 10],
    ['19.99', 1999],
    ['$12.30', 1230],
  ])('dollarsToCents(%s) = %s', (value, cents) => {
    expect(aiInput.dollarsToCents({ value, label: 'Value' })).toBe(cents);
  });

  test.each(['-1', '1.234', 'abc', '1,000'])('dollarsToCents rejects %s', (value) => {
    expect(() => aiInput.dollarsToCents({ value, label: 'Value' })).toThrow('Value must be');
  });

  test('centsToDecimal', () => {
    expect(aiInput.centsToDecimal('123450')).toBe('1234.50');
    expect(aiInput.centsToDecimal('29')).toBe('0.29');
    expect(aiInput.centsToDecimal('5')).toBe('0.05');
  });

  test('isoDateTime is strict about the format and reads a date-time without an offset as UTC', () => {
    expect(aiInput.isoDateTime({ value: '2026-03-01', label: 'Due' })).toBe('2026-03-01T00:00:00.000Z');
    expect(aiInput.isoDateTime({ value: '2026-03-01T09:00:00+02:00', label: 'Due' })).toBe('2026-03-01T07:00:00.000Z');
    expect(() => aiInput.isoDateTime({ value: 'tomorrow 9am', label: 'Due' })).toThrow('ISO 8601');
    expect(aiInput.isoDateTime({ value: '2026-03-01T09:00:00', label: 'Due' })).toBe('2026-03-01T09:00:00.000Z');
    expect(() => aiInput.isoDateTime({ value: '2026-03-01 09:00:00', label: 'Due' })).toThrow('ISO 8601');
    expect(() => aiInput.isoDateTime({ value: '2026-03-01T25:00', label: 'Due' })).toThrow('ISO 8601');
  });

  test.each(['2026-02-30', '2026-02-29', '2026-04-31', '2026-13-01', '2026-03-01T24:00:00Z', '2026-03-01T09:60:00Z', '2026-02-30T09:00:00Z'])(
    'isoDateTime refuses the impossible date %s',
    (value) => {
      expect(() => aiInput.isoDateTime({ value, label: 'Due' })).toThrow('ISO 8601');
    },
  );

  test('isoDateTime accepts a leap day', () => {
    expect(aiInput.isoDateTime({ value: '2028-02-29', label: 'Due' })).toBe('2028-02-29T00:00:00.000Z');
  });

  test('metadata from the live run', () => {
    expect(createTagAction.aiMetadata?.idempotent).toBe(true);
    expect(createTagAction.aiMetadata?.description).toContain('already exists');
    expect(removeContactFromAutomationAction.aiMetadata?.idempotent).toBe(true);
    expect(associateContactWithAccountAction.aiMetadata?.idempotent).toBe(false);
    expect(associateContactWithAccountAction.aiMetadata?.description).toContain('only one account');
    expect(associateContactWithAccountAction.description).toContain('only one account');
  });

  test('custom fields: arrays become ||a||b|| for contacts and stay arrays for accounts', () => {
    const entries = aiInput.customFieldEntries({ value: { '3': 'Gold', '7': ['A', 'B'], '9': 4 }, label: 'Custom Fields' });
    expect(aiInput.contactFieldValues(entries)).toEqual([
      { field: '3', value: 'Gold' },
      { field: '7', value: '||A||B||' },
      { field: '9', value: '4' },
    ]);
    expect(aiInput.accountFields(entries)).toEqual([
      { customFieldId: 3, fieldValue: 'Gold' },
      { customFieldId: 7, fieldValue: ['A', 'B'] },
      { customFieldId: 9, fieldValue: '4' },
    ]);
    expect(() => aiInput.customFieldEntries({ value: { Tier: 'Gold' }, label: 'Custom Fields' })).toThrow('not a custom field ID');
  });

  test('pageParams validates the range', () => {
    expect(aiInput.pageParams({ limit: undefined, offset: undefined })).toEqual({ limit: 20, offset: 0 });
    expect(() => aiInput.pageParams({ limit: 101, offset: 0 })).toThrow('between 1 and 100');
  });
});

describe('contact resolution', () => {
  test('numeric IDs are used directly', async () => {
    const seen = route({ 'DELETE /api/3/contacts/12': { status: 200, body: {} } });
    expect(await deleteContactAction.run(ctx({ contact_id_or_email: '12' }))).toEqual({ deleted: true, contactId: '12' });
    expect(seen.map((r) => r.key)).toEqual(['DELETE /api/3/contacts/12']);
  });

  test('an email is looked up first', async () => {
    const seen = route({
      'GET /api/3/contacts': { status: 200, body: { contacts: [{ id: '44', email: 'Jane@Example.com' }] } },
      'DELETE /api/3/contacts/44': { status: 200, body: {} },
    });
    expect(await deleteContactAction.run(ctx({ contact_id_or_email: 'jane@example.com' }))).toEqual({ deleted: true, contactId: '44' });
    expect(seen[0].query.get('email')).toBe('jane@example.com');
  });

  test('an unknown email fails without a write', async () => {
    const seen = route({ 'GET /api/3/contacts': { status: 200, body: { contacts: [] } } });
    await expect(addContactToAutomationAiAction.run(ctx({ contact_id_or_email: 'nobody@example.com', automation_id: '3' }))).rejects.toThrow(
      'No ActiveCampaign contact has the email nobody@example.com',
    );
    expect(seen).toHaveLength(1);
  });

  test('a value that is neither an ID nor an email is refused', async () => {
    const seen = route({});
    await expect(getContactAction.run(ctx({ contact_id_or_email: 'Jane Doe' }))).rejects.toThrow('numeric contact ID or an email');
    expect(seen).toHaveLength(0);
  });
});

describe('requests per action', () => {
  test('list contacts', async () => {
    const seen = route({ 'GET /api/3/contacts': { status: 200, body: { contacts: [{ id: '1', email: 'a@b.co', links: {} }], meta: { total: '41' } } } });
    const result = await listContactsAction.run(
      ctx({ search: 'jane', tag_id: '4', list_id: '2', status: '1', updated_after: '2026-01-01', limit: 10, offset: 20 }),
    );
    expect(result).toEqual({ items: [{ id: '1', email: 'a@b.co' }], total: 41, offset: 20, limit: 10, hasMore: true });
    expect(Object.fromEntries(seen[0].query)).toEqual({
      search: 'jane',
      tagid: '4',
      listid: '2',
      status: '1',
      'filters[updated_after]': '2026-01-01T00:00:00.000Z',
      'orders[cdate]': 'ASC',
      limit: '10',
      offset: '20',
    });
  });

  test('list contacts refuses status without list', async () => {
    route({});
    await expect(listContactsAction.run(ctx({ status: '1' }))).rejects.toThrow('List Status needs a List ID.');
  });

  test('get contact', async () => {
    const seen = route({
      'GET /api/3/contacts/9': { status: 200, body: { contact: { id: '9', email: 'a@b.co', firstName: 'A' } } },
      'GET /api/3/contacts/9/fieldValues': { status: 200, body: { fieldValues: [{ id: '1', field: '3', value: 'Gold', contact: '9' }], meta: { total: '1' } } },
      'GET /api/3/contacts/9/contactTags': { status: 200, body: { contactTags: [{ id: '70', tag: '5', contact: '9' }], meta: { total: '1' } } },
      'GET /api/3/contacts/9/contactLists': { status: 200, body: { contactLists: [{ id: '2', list: '1', status: '2' }], meta: { total: '1' } } },
    });
    expect(await getContactAction.run(ctx({ contact_id_or_email: '9' }))).toEqual({
      contact: { id: '9', email: 'a@b.co', firstName: 'A' },
      fieldValues: [{ id: '1', field: '3', value: 'Gold' }],
      tags: [{ id: '70', tag: '5' }],
      lists: [{ list: '1', status: 'unsubscribed' }],
    });
    expect(seen).toHaveLength(4);
  });

  test('create or update contact by email', async () => {
    const seen = route({ 'POST /api/3/contact/sync': { status: 201, body: { contact: { id: '9', email: 'a@b.co' }, fieldValues: [{ field: '3', value: 'Gold', id: '1' }] } } });
    const result = await createOrUpdateContactAiAction.run(ctx({ email: 'a@b.co', first_name: 'Ann', custom_fields: { '3': 'Gold' } }));
    expect(result).toEqual({ created: true, contact: { id: '9', email: 'a@b.co' }, fieldValues: [{ field: '3', value: 'Gold' }] });
    expect(seen[0].body).toEqual({ contact: { email: 'a@b.co', firstName: 'Ann', fieldValues: [{ field: '3', value: 'Gold' }] } });
    expect(seen[0].query.get('lookupByAcId')).toBeNull();
  });

  test('create or update contact by ID reports an update', async () => {
    const seen = route({ 'POST /api/3/contact/sync': { status: 200, body: { contact: { id: '9', email: 'new@b.co' } } } });
    const result = await createOrUpdateContactAiAction.run(ctx({ email: 'new@b.co', contact_id: '9' }));
    expect(result).toMatchObject({ created: false });
    expect(seen[0].body).toEqual({ contact: { email: 'new@b.co', id: '9' } });
    expect(seen[0].query.get('lookupByAcId')).toBe('true');
  });

  test('list tags', async () => {
    const seen = route({ 'GET /api/3/tags': { status: 200, body: { tags: [{ id: '5', tag: 'vip', tagType: 'contact', links: {} }], meta: { total: '1' } } } });
    expect(await listTagsAction.run(ctx({ search: 'vi' }))).toEqual({
      items: [{ id: '5', tag: 'vip', tagType: 'contact' }],
      total: 1,
      offset: 0,
      limit: 20,
      hasMore: false,
    });
    expect(seen[0].query.get('search')).toBe('vi');
  });

  test('create tag', async () => {
    const seen = route({ 'POST /api/3/tags': { status: 201, body: { tag: { id: '6', tag: 'new', tagType: 'contact', links: {} } } } });
    expect(await createTagAction.run(ctx({ name: 'new', description: 'd' }))).toEqual({ id: '6', tag: 'new', tagType: 'contact' });
    expect(seen[0].body).toEqual({ tag: { tag: 'new', tagType: 'contact', description: 'd' } });
  });

  test('add tag reports created from the status', async () => {
    const seen = route({ 'POST /api/3/contactTags': { status: 200, body: { contactTag: { id: '70', contact: '9', tag: '5' } } } });
    expect(await addTagToContactAiAction.run(ctx({ contact_id_or_email: '9', tag_id: '5' }))).toEqual({
      associationId: '70',
      contactId: '9',
      tagId: '5',
      created: false,
    });
    expect(seen[0].body).toEqual({ contactTag: { contact: '9', tag: '5' } });
  });

  test('remove tag', async () => {
    const seen = route({
      'GET /api/3/contacts/9/contactTags': { status: 200, body: { contactTags: [{ id: '70', tag: '5' }], meta: { total: '1' } } },
      'DELETE /api/3/contactTags/70': { status: 200, body: {} },
    });
    expect(await removeTagFromContactAiAction.run(ctx({ contact_id_or_email: '9', tag_id: '5' }))).toEqual({ removed: true, contactId: '9', tagId: '5' });
    expect(seen.map((r) => r.key)).toEqual(['GET /api/3/contacts/9/contactTags', 'DELETE /api/3/contactTags/70']);
  });

  test('list lists', async () => {
    const seen = route({ 'GET /api/3/lists': { status: 200, body: { lists: [{ id: '1', name: 'News', stringid: 'news' }], meta: { total: '1' } } } });
    expect(await listListsAction.run(ctx({ name: 'News' }))).toMatchObject({ items: [{ id: '1', name: 'News', stringid: 'news' }], total: 1 });
    expect(seen[0].query.get('filters[name]')).toBe('News');
  });

  test.each([
    [subscribeContactToListAction, 1, 'subscribed'],
    [unsubscribeContactFromListAction, 2, 'unsubscribed'],
  ])('list membership status %#', async (action, status, label) => {
    const seen = route({ 'POST /api/3/contactLists': { status: 200, body: { contactList: { id: '3', list: '1', contact: '9', status: String(status) }, contacts: [] } } });
    expect(await action.run(ctx({ contact_id_or_email: '9', list_id: '1' }))).toEqual({
      contactId: '9',
      listId: '1',
      status: label,
      contactList: { id: '3', list: '1', contact: '9', status: String(status) },
    });
    expect(seen[0].body).toEqual({ contactList: { list: '1', contact: '9', status: String(status) } });
  });

  test('numeric ids in a first subscribe are returned as strings, like a repeat', async () => {
    route({ 'POST /api/3/contactLists': { status: 201, body: { contactList: { id: 3, list: 3, contact: 9, status: 1, sourceid: 4 }, contacts: [] } } });
    const first = await subscribeContactToListAction.run(ctx({ contact_id_or_email: '9', list_id: '3' }));
    route({ 'POST /api/3/contactLists': { status: 200, body: { contactList: { id: '3', list: '3', contact: '9', status: '1', sourceid: '4' }, contacts: [] } } });
    const repeat = await subscribeContactToListAction.run(ctx({ contact_id_or_email: '9', list_id: '3' }));
    expect(first).toEqual(repeat);
    expect(first).toMatchObject({ contactList: { id: '3', list: '3', contact: '9', status: '1', sourceid: '4' } });
  });

  test('list contact custom fields joins options', async () => {
    route({
      'GET /api/3/fields': {
        status: 200,
        body: { fields: [{ id: '3', title: 'Tier', type: 'dropdown', perstag: 'TIER' }], fieldOptions: [{ field: '3', value: 'Gold', label: 'Gold', id: '8' }], meta: { total: '1' } },
      },
    });
    expect(await listContactCustomFieldsAction.run(ctx({}))).toEqual({
      items: [{ id: '3', title: 'Tier', type: 'dropdown', perstag: 'TIER', options: [{ value: 'Gold', label: 'Gold' }] }],
      total: 1,
    });
  });

  test('list account custom fields', async () => {
    route({ 'GET /api/3/accountCustomFieldMeta': { status: 200, body: { accountCustomFieldMeta: [{ id: '2', fieldLabel: 'Plan', fieldType: 'dropdown', fieldOptions: ['A'] }], meta: { total: 1 } } } });
    expect(await listAccountCustomFieldsAction.run(ctx({}))).toEqual({ items: [{ id: '2', fieldLabel: 'Plan', fieldType: 'dropdown', fieldOptions: ['A'] }], total: 1 });
  });

  test('list accounts', async () => {
    const seen = route({ 'GET /api/3/accounts': { status: 200, body: { accounts: [{ id: '1', name: 'Acme', contactCount: '2' }], meta: { total: '1' } } } });
    expect(await listAccountsAction.run(ctx({ search: 'Ac' }))).toMatchObject({ items: [{ id: '1', name: 'Acme', contactCount: '2' }] });
    expect(seen[0].query.get('search')).toBe('Ac');
    expect(seen[0].query.get('count_deals')).toBe('true');
  });

  test('create account', async () => {
    const seen = route({ 'POST /api/3/accounts': { status: 201, body: { account: { id: '1', name: 'Acme', fields: [{ customFieldId: 2, fieldValue: 'A' }] } } } });
    expect(await createAccountAiAction.run(ctx({ name: 'Acme', custom_fields: { '2': 'A' } }))).toEqual({
      id: '1',
      name: 'Acme',
      fields: [{ customFieldId: '2', fieldValue: 'A' }],
    });
    expect(seen[0].body).toEqual({ account: { name: 'Acme', fields: [{ customFieldId: 2, fieldValue: 'A' }] } });
  });

  test('update account sends only given fields and refuses an empty update', async () => {
    const seen = route({ 'PUT /api/3/accounts/1': { status: 200, body: { account: { id: '1', name: 'Acme 2' } } } });
    await updateAccountAiAction.run(ctx({ account_id: '1', name: 'Acme 2' }));
    expect(seen[0].body).toEqual({ account: { name: 'Acme 2' } });
    await expect(updateAccountAiAction.run(ctx({ account_id: '1' }))).rejects.toThrow('Nothing to update');
  });

  test('update account with only a URL sends no fields and omits fields the response does not carry', async () => {
    const seen = route({ 'PUT /api/3/accounts/1': { status: 200, body: { account: { id: 1, name: 'Acme', accountUrl: 'https://acme.io' } } } });
    expect(await updateAccountAiAction.run(ctx({ account_id: '1', account_url: 'https://acme.io' }))).toEqual({
      id: '1',
      name: 'Acme',
      accountUrl: 'https://acme.io',
    });
    expect(seen[0].body).toEqual({ account: { accountUrl: 'https://acme.io' } });
  });

  test('associate contact with account', async () => {
    const seen = route({ 'POST /api/3/accountContacts': { status: 201, body: { accountContact: { id: '5', contact: '9', account: '1', jobTitle: 'CEO' } } } });
    expect(await associateContactWithAccountAction.run(ctx({ contact_id_or_email: '9', account_id: '1', job_title: 'CEO' }))).toEqual({
      associationId: '5',
      contactId: '9',
      accountId: '1',
      jobTitle: 'CEO',
    });
    expect(seen[0].body).toEqual({ accountContact: { contact: '9', account: '1', jobTitle: 'CEO' } });
  });

  test('list pipelines and stages', async () => {
    const seen = route({
      'GET /api/3/dealGroups': { status: 200, body: { dealGroups: [{ id: '1', title: 'Sales', currency: 'usd' }], meta: { total: '1' } } },
      'GET /api/3/dealStages': { status: 200, body: { dealStages: [{ id: '4', title: 'Won', group: '1', order: '2' }], meta: { total: '1' } } },
    });
    expect(await listPipelinesAction.run(ctx({}))).toEqual({ items: [{ id: '1', title: 'Sales', currency: 'usd' }], total: 1 });
    expect(await listDealStagesAction.run(ctx({ pipeline_id: '1' }))).toEqual({ items: [{ id: '4', title: 'Won', group: '1', order: '2' }], total: 1 });
    expect(seen[1].query.get('filters[d_groupid]')).toBe('1');
  });

  test('list deals maps status and value', async () => {
    const seen = route({ 'GET /api/3/deals': { status: 200, body: { deals: [{ id: '7', title: 'Big', value: '123450', currency: 'usd', status: '1' }], meta: { total: '1' } } } });
    expect(await listDealsAction.run(ctx({ search: 'Big', status: 'won', pipeline_id: '1' }))).toMatchObject({
      items: [{ id: '7', title: 'Big', value: '123450', valueFormatted: '1234.50', currency: 'usd', status: 'won' }],
    });
    expect(seen[0].query.get('filters[status]')).toBe('1');
    expect(seen[0].query.get('filters[search]')).toBe('Big');
    expect(seen[0].query.get('filters[group]')).toBe('1');
  });

  test('get deal', async () => {
    route({ 'GET /api/3/deals/7': { status: 200, body: { deal: { id: '7', title: 'Big', status: '0' } } } });
    expect(await getDealAction.run(ctx({ deal_id: '7' }))).toEqual({ deal: { id: '7', title: 'Big', status: 'open' } });
  });

  test('create deal converts the value to cents exactly', async () => {
    const seen = route({ 'POST /api/3/deals': { status: 201, body: { deal: { id: '8', title: 'T', value: '29' } } } });
    await createDealAiAction.run(ctx({ title: 'T', value: '0.29', currency: 'USD', stage_id: '4', contact_id_or_email: '9', status: 'won' }));
    expect(seen[0].body).toEqual({ deal: { title: 'T', value: 29, currency: 'usd', stage: '4', contact: '9', status: 1 } });
  });

  test('create deal needs a pipeline or stage', async () => {
    const seen = route({});
    await expect(createDealAiAction.run(ctx({ title: 'T', value: '1', currency: 'usd' }))).rejects.toThrow('Pipeline ID or a Stage ID');
    expect(seen).toHaveLength(0);
  });

  test('create deal needs a contact or an account before any request', async () => {
    const seen = route({});
    await expect(createDealAiAction.run(ctx({ title: 'T', value: '1', currency: 'usd', stage_id: '4' }))).rejects.toThrow('Give a Contact ID or Email, an Account ID or both');
    expect(seen).toHaveLength(0);
  });

  test('a pipeline that does not auto-assign owners gets an Owner ID hint on create and update', async () => {
    route({
      'POST /api/3/deals': { status: 422, body: { errors: [{ title: 'The provided pipeline does not support auto-assigning deal owners. The deal owner id needs to be provided.', source: { pointer: '/data/attributes/owner' } }] } },
      'PUT /api/3/deals/8': { status: 422, body: { errors: [{ title: 'The provided pipeline does not support auto-assigning deal owners. The deal owner id needs to be provided.', source: { pointer: '/data/attributes/owner' } }] } },
    });
    const hint = 'This pipeline does not auto-assign owners: set Owner User ID (use List Users).';
    await expect(createDealAiAction.run(ctx({ title: 'T', value: '1', currency: 'usd', pipeline_id: '1', stage_id: '1', account_id: '5' }))).rejects.toThrow(
      `ActiveCampaign POST /deals failed (422): The provided pipeline does not support auto-assigning deal owners. The deal owner id needs to be provided. ${hint}`,
    );
    const error = await updateDealAiAction.run(ctx({ deal_id: '8', pipeline_id: '2' })).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(ActiveCampaignApiError);
    expect(error).toMatchObject({ status: 422, responseBody: { errors: [{ source: { pointer: '/data/attributes/owner' } }] } });
    expect(String(error)).toContain(hint);
  });

  test('other deal 422s carry no owner hint', async () => {
    route({ 'POST /api/3/deals': { status: 422, body: { errors: [{ title: 'Stage does not exist' }] } } });
    const error = await createDealAiAction.run(ctx({ title: 'T', value: '1', currency: 'usd', stage_id: '99', account_id: '5' })).catch((caught: unknown) => String(caught));
    expect(error).toContain('Stage does not exist');
    expect(error).not.toContain('auto-assign');
  });

  test('deal status accepts open/won/lost and the codes 0/1/2', async () => {
    expect(['open', 'Won', 'LOST', '0', '1', '2'].map((status) => aiInput.dealStatusCode(status))).toEqual([0, 1, 2, 0, 1, 2]);
    expect(aiInput.dealStatusCode('')).toBeUndefined();
    expect(() => aiInput.dealStatusCode('3')).toThrow('Status must be open, won or lost');
    expect(() => aiInput.dealStatusCode('closed')).toThrow('Status must be open, won or lost');
  });

  test('update deal sends only changes', async () => {
    const seen = route({ 'PUT /api/3/deals/8': { status: 200, body: { deal: { id: '8', stage: '5' } } } });
    await updateDealAiAction.run(ctx({ deal_id: '8', stage_id: '5', value: '1234.5' }));
    expect(seen[0].body).toEqual({ deal: { value: 123450, stage: '5' } });
  });

  test('create note on a contact by email', async () => {
    const seen = route({
      'GET /api/3/contacts': { status: 200, body: { contacts: [{ id: '9', email: 'a@b.co' }] } },
      'POST /api/3/notes': { status: 201, body: { note: { id: '3', note: 'Hi', reltype: 'Subscriber', relid: '9', links: {} } } },
    });
    expect(await createNoteAiAction.run(ctx({ record_type: 'Subscriber', record_id: 'a@b.co', note: 'Hi' }))).toEqual({
      id: '3',
      note: 'Hi',
      reltype: 'Subscriber',
      relid: '9',
    });
    expect(seen[1].body).toEqual({ note: { note: 'Hi', reltype: 'Subscriber', relid: '9' } });
  });

  test('list task types and users', async () => {
    route({
      'GET /api/3/dealTasktypes': { status: 200, body: { dealTasktypes: [{ id: '1', title: 'Call' }], meta: { total: '1' } } },
      'GET /api/3/users': { status: 200, body: { users: [{ id: '1', username: 'admin', email: 'a@b.co', password: 'x' }], meta: { total: '1' } } },
    });
    expect(await listTaskTypesAction.run(ctx({}))).toEqual({ items: [{ id: '1', title: 'Call' }], total: 1 });
    expect(await listUsersAction.run(ctx({}))).toEqual({ items: [{ id: '1', username: 'admin', email: 'a@b.co' }], total: 1 });
  });

  test('create task', async () => {
    const seen = route({ 'POST /api/3/dealTasks': { status: 201, body: { dealTask: { id: '11', relid: '8', duedate: '2026-03-01T09:00:00Z' } } } });
    await createTaskAiAction.run(ctx({ owner_type: 'deal', record_id: '8', task_type_id: '1', due_date: '2026-03-01T09:00:00Z', title: 'Call' }));
    expect(seen[0].body).toEqual({ dealTask: { ownerType: 'deal', relid: '8', dealTasktype: '1', duedate: '2026-03-01T09:00:00.000Z', title: 'Call' } });
  });

  test('task output keeps a null note and turns numeric ids into strings', async () => {
    route({ 'PUT /api/3/dealTasks/11': { status: 200, body: { dealTask: { id: 11, relid: 8, assignee: null, note: null, dealTasktype: 1, status: 1 } } } });
    expect(await completeTaskAction.run(ctx({ task_id: '11' }))).toEqual({ id: '11', relid: '8', assignee: null, note: null, dealTasktype: '1', status: '1' });
  });

  test('a date-only due date is sent as noon UTC so it stays on that day in the account time zone', async () => {
    const seen = route({ 'POST /api/3/dealTasks': { status: 201, body: { dealTask: { id: '12' } } } });
    await createTaskAiAction.run(ctx({ owner_type: 'deal', record_id: '8', task_type_id: '1', due_date: '2026-11-25', end_date: '2026-11-25' }));
    expect(seen[0].body).toMatchObject({ dealTask: { duedate: '2026-11-25T12:00:00.000Z', edate: '2026-11-25T12:00:00.000Z' } });
    await createTaskAiAction.run(ctx({ owner_type: 'deal', record_id: '8', task_type_id: '1', due_date: '2026-11-25T09:00:00-06:00' }));
    expect(seen[1].body).toMatchObject({ dealTask: { duedate: '2026-11-25T15:00:00.000Z' } });
  });

  test('create task refuses an end before the due date', async () => {
    route({});
    await expect(
      createTaskAiAction.run(ctx({ owner_type: 'deal', record_id: '8', task_type_id: '1', due_date: '2026-03-02', end_date: '2026-03-01' })),
    ).rejects.toThrow('End Date must not be before Due Date.');
  });

  test('complete task', async () => {
    const seen = route({ 'PUT /api/3/dealTasks/11': { status: 200, body: { dealTask: { id: '11', status: 1 } } } });
    expect(await completeTaskAction.run(ctx({ task_id: '11' }))).toEqual({ id: '11', status: '1' });
    expect(seen[0].body).toEqual({ dealTask: { status: 1 } });
  });

  test('list automations', async () => {
    const seen = route({ 'GET /api/3/automations': { status: 200, body: { automations: [{ id: '3', name: 'Welcome', status: '1' }], meta: { total: '1' } } } });
    expect(await listAutomationsAction.run(ctx({ limit: 5 }))).toMatchObject({ items: [{ id: '3', name: 'Welcome', status: '1' }], limit: 5 });
    expect(seen[0].query.get('limit')).toBe('5');
  });

  test('add contact to automation', async () => {
    const seen = route({ 'POST /api/3/contactAutomations': { status: 201, body: { contactAutomation: { id: '50', status: '1' } } } });
    expect(await addContactToAutomationAiAction.run(ctx({ contact_id_or_email: '9', automation_id: '3' }))).toEqual({
      contactAutomationId: '50',
      contactId: '9',
      automationId: '3',
      status: '1',
    });
    expect(seen[0].body).toEqual({ contactAutomation: { contact: '9', automation: '3' } });
  });

  test('remove contact from automation deletes only active runs of that automation', async () => {
    const seen = route({
      'GET /api/3/contacts/9/contactAutomations': {
        status: 200,
        body: {
          contactAutomations: [
            { id: '50', automation: '3', status: '1' },
            { id: '51', automation: '3', status: '2' },
            { id: '52', automation: '4', status: '1' },
          ],
          meta: { total: '3' },
        },
      },
      'DELETE /api/3/contactAutomations/50': { status: 200, body: {} },
    });
    expect(await removeContactFromAutomationAction.run(ctx({ contact_id_or_email: '9', automation_id: '3' }))).toEqual({
      removed: true,
      contactId: '9',
      automationId: '3',
      contactAutomationIds: ['50'],
    });
    expect(seen.map((r) => r.key)).toEqual(['GET /api/3/contacts/9/contactAutomations', 'DELETE /api/3/contactAutomations/50']);
  });
});

function ctx(propsValue: Record<string, unknown>) {
  return Object.assign(Object.create(null), {
    auth: { type: 'CUSTOM_AUTH', props: { apiUrl: 'https://acme.api-us1.com', apiKey: 'key' } },
    propsValue,
  });
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

const CAPTURED_AI_OUTPUTS: Record<string, { action: string; output: unknown }> = {
  "add_contact_to_automation": {
    "action": "activecampaign_add_contact_to_automation",
    "output": {
      "contactAutomationId": "1",
      "contactId": "2",
      "automationId": "1",
      "status": "1"
    }
  },
  "add_contact_to_automation_repeat": {
    "action": "activecampaign_add_contact_to_automation",
    "output": {
      "contactAutomationId": "2",
      "contactId": "2",
      "automationId": "1",
      "status": "1"
    }
  },
  "add_tag_to_contact_ai": {
    "action": "activecampaign_add_tag_to_contact_ai",
    "output": {
      "associationId": "4",
      "contactId": "3",
      "tagId": "1",
      "created": true
    }
  },
  "associate_contact_with_account": {
    "action": "activecampaign_associate_contact_with_account",
    "output": {
      "associationId": "3",
      "contactId": "5",
      "accountId": "2",
      "jobTitle": "Eng"
    }
  },
  "complete_task": {
    "action": "activecampaign_complete_task",
    "output": {
      "id": "4",
      "title": "date-only check",
      "note": null,
      "relid": "2",
      "reltype": "Subscriber",
      "duedate": "2026-11-25T06:00:00-06:00",
      "edate": "2026-11-25T06:15:00-06:00",
      "status": "1",
      "assignee": null,
      "dealTasktype": "3",
      "cdate": "2026-11-08T01:41:02-06:00"
    }
  },
  "complete_task_deal": {
    "action": "activecampaign_complete_task",
    "output": {
      "id": "7",
      "title": "deal task",
      "note": null,
      "relid": "1",
      "reltype": "Deal",
      "duedate": "2026-11-28T06:00:00-06:00",
      "edate": "2026-11-28T06:15:00-06:00",
      "status": "1",
      "assignee": null,
      "dealTasktype": "1",
      "cdate": "2026-11-08T05:15:38-06:00"
    }
  },
  "create_account_ai": {
    "action": "activecampaign_create_account_ai",
    "output": {
      "id": "3",
      "name": "AP QA Cap",
      "createdTimestamp": "2026-11-08T01:46:42-06:00",
      "updatedTimestamp": "2026-11-08T01:46:42-06:00",
      "fields": [
        {
          "customFieldId": "4",
          "fieldValue": "Irbid"
        }
      ]
    }
  },
  "create_deal": {
    "action": "activecampaign_create_deal",
    "output": {
      "deal": {
        "id": "1",
        "title": "QA Deal AI",
        "description": "ai deal",
        "currency": "usd",
        "group": "1",
        "stage": "1",
        "owner": "1",
        "contact": "2",
        "account": null,
        "cdate": "2026-11-08T05:15:12-06:00",
        "mdate": "2026-11-08T05:15:12-06:00",
        "isDisabled": false,
        "value": "123450",
        "valueFormatted": "1234.50",
        "status": "open"
      }
    }
  },
  "create_for_delete": {
    "action": "activecampaign_create_or_update_contact",
    "output": {
      "created": true,
      "contact": {
        "id": "6",
        "email": "apqa-del2@example.com",
        "firstName": "",
        "lastName": "",
        "phone": "",
        "cdate": "2026-11-08T01:46:56-06:00",
        "udate": "2026-11-08T01:46:56-06:00",
        "orgid": "0"
      },
      "fieldValues": []
    }
  },
  "create_note": {
    "action": "activecampaign_create_note",
    "output": {
      "id": "4",
      "note": "capture note",
      "reltype": "Subscriber",
      "relid": "2",
      "cdate": "2026-11-08T01:46:49-06:00"
    }
  },
  "create_note_deal": {
    "action": "activecampaign_create_note",
    "output": {
      "id": "6",
      "note": "deal note from AP",
      "reltype": "Deal",
      "relid": "1",
      "cdate": "2026-11-08T05:15:36-06:00"
    }
  },
  "create_or_update_contact": {
    "action": "activecampaign_create_or_update_contact",
    "output": {
      "created": false,
      "contact": {
        "id": "2",
        "email": "apqa1@example.com",
        "firstName": "QA",
        "lastName": "Trig",
        "phone": "+15550001",
        "cdate": "2026-11-08T01:30:31-06:00",
        "udate": "2026-11-08T01:46:31-06:00",
        "orgid": "1"
      },
      "fieldValues": [
        {
          "field": "1",
          "value": "French"
        }
      ]
    }
  },
  "create_or_update_contact_new": {
    "action": "activecampaign_create_or_update_contact",
    "output": {
      "created": true,
      "contact": {
        "id": "5",
        "email": "apqa5@example.com",
        "firstName": "Five",
        "lastName": "",
        "phone": "",
        "cdate": "2026-11-08T01:46:46-06:00",
        "udate": "2026-11-08T01:46:46-06:00",
        "orgid": "0"
      },
      "fieldValues": []
    }
  },
  "create_tag": {
    "action": "activecampaign_create_tag",
    "output": {
      "id": "3",
      "tag": "ap-qa-tag-2",
      "tagType": "contact",
      "description": "cap",
      "cdate": "2026-11-08T01:46:33-06:00"
    }
  },
  "create_task": {
    "action": "activecampaign_create_task",
    "output": {
      "id": "5",
      "title": "cap task",
      "relid": "2",
      "reltype": "Subscriber",
      "duedate": "2026-11-26T06:00:00-06:00",
      "edate": "2026-11-26T06:15:00-06:00",
      "status": "",
      "assignee": null,
      "dealTasktype": "4",
      "cdate": "2026-11-08T01:46:51-06:00"
    }
  },
  "create_task_deal": {
    "action": "activecampaign_create_task",
    "output": {
      "id": "7",
      "title": "deal task",
      "relid": "1",
      "reltype": "Deal",
      "duedate": "2026-11-28T06:00:00-06:00",
      "edate": "2026-11-28T06:15:00-06:00",
      "status": "",
      "assignee": null,
      "dealTasktype": "1",
      "cdate": "2026-11-08T05:15:38-06:00"
    }
  },
  "delete_contact": {
    "action": "activecampaign_delete_contact",
    "output": {
      "deleted": true,
      "contactId": "6"
    }
  },
  "get_contact": {
    "action": "activecampaign_get_contact",
    "output": {
      "contact": {
        "id": "2",
        "email": "apqa1@example.com",
        "firstName": "QA2",
        "lastName": "Trig",
        "phone": "+15550001",
        "cdate": "2026-11-08T01:30:31-06:00",
        "udate": "2026-11-08T01:41:02-06:00",
        "orgid": "1"
      },
      "fieldValues": [
        {
          "id": "1",
          "field": "1",
          "value": "French"
        }
      ],
      "tags": [
        {
          "id": "3",
          "tag": "1"
        }
      ],
      "lists": [
        {
          "list": "3",
          "status": "subscribed"
        }
      ]
    }
  },
  "get_deal": {
    "action": "activecampaign_get_deal",
    "output": {
      "deal": {
        "id": "1",
        "title": "QA Deal AI",
        "description": "ai deal",
        "currency": "usd",
        "group": "1",
        "stage": "1",
        "owner": "1",
        "contact": "2",
        "account": null,
        "cdate": "2026-11-08T05:15:12-06:00",
        "mdate": "2026-11-08T05:15:13-06:00",
        "isDisabled": false,
        "value": "123450",
        "valueFormatted": "1234.50",
        "status": "open"
      }
    }
  },
  "get_deal_after_update": {
    "action": "activecampaign_get_deal",
    "output": {
      "deal": {
        "id": "1",
        "title": "QA Deal AI",
        "description": "ai deal",
        "currency": "usd",
        "group": "1",
        "stage": "2",
        "owner": "1",
        "contact": "2",
        "account": null,
        "cdate": "2026-11-08T05:15:12-06:00",
        "mdate": "2026-11-08T05:15:17-06:00",
        "isDisabled": false,
        "value": "29",
        "valueFormatted": "0.29",
        "status": "open"
      }
    }
  },
  "list_account_custom_fields": {
    "action": "activecampaign_list_account_custom_fields",
    "output": {
      "items": [
        {
          "id": "1",
          "fieldLabel": "Description",
          "fieldType": "text",
          "fieldOptions": null
        },
        {
          "id": "2",
          "fieldLabel": "Address 1",
          "fieldType": "text",
          "fieldOptions": null
        },
        {
          "id": "3",
          "fieldLabel": "Address 2",
          "fieldType": "text",
          "fieldOptions": null
        },
        {
          "id": "4",
          "fieldLabel": "City",
          "fieldType": "text",
          "fieldOptions": null
        },
        {
          "id": "5",
          "fieldLabel": "State/Province",
          "fieldType": "text",
          "fieldOptions": null
        },
        {
          "id": "6",
          "fieldLabel": "Postal Code",
          "fieldType": "text",
          "fieldOptions": null
        },
        {
          "id": "7",
          "fieldLabel": "Country",
          "fieldType": "text",
          "fieldOptions": null
        },
        {
          "id": "8",
          "fieldLabel": "Number of Employees",
          "fieldType": "dropdown",
          "fieldOptions": [
            "1 - 25",
            "26 - 50",
            "51 - 100",
            "101 - 500",
            "501 - 1000",
            "More than 1000"
          ]
        },
        {
          "id": "9",
          "fieldLabel": "Annual Revenue",
          "fieldType": "dropdown",
          "fieldOptions": [
            "Less than 100K",
            "100K - 500K",
            "501K - 1M",
            "1M - 5M",
            "6M - 10M",
            "More than 10M"
          ]
        },
        {
          "id": "10",
          "fieldLabel": "Industry/Vertical",
          "fieldType": "dropdown",
          "fieldOptions": [
            "Accounting/Financial",
            "Consulting/Agency",
            "Blogger/Author",
            "E-commerce/Retail",
            "Entertainment/Events",
            "Fitness/Nutrition",
            "Healthcare",
            "Media/Publishing",
            "Non-Profit",
            "Online Training/Education",
            "Real Estate",
            "Software",
            "Travel/Hospitality",
            "Other"
          ]
        },
        {
          "id": "11",
          "fieldLabel": "Phone Number",
          "fieldType": "text",
          "fieldOptions": null
        }
      ],
      "total": 11
    }
  },
  "list_accounts": {
    "action": "activecampaign_list_accounts",
    "output": {
      "items": [
        {
          "id": "1",
          "name": "AP QA Corp Trig",
          "accountUrl": "https://example.org",
          "createdTimestamp": "2026-11-08T01:31:19-06:00",
          "updatedTimestamp": "2026-11-08T01:36:47-06:00",
          "contactCount": "1",
          "dealCount": "0"
        },
        {
          "id": "2",
          "name": "AP QA Two Upd",
          "accountUrl": "",
          "createdTimestamp": "2026-11-08T01:32:28-06:00",
          "updatedTimestamp": "2026-11-08T01:32:34-06:00",
          "contactCount": "1",
          "dealCount": "0"
        }
      ],
      "total": 2,
      "offset": 0,
      "limit": 20,
      "hasMore": false
    }
  },
  "list_automations": {
    "action": "activecampaign_list_automations",
    "output": {
      "items": [
        {
          "id": "1",
          "name": "Consulting Client Nurture Email Series",
          "status": "0",
          "entered": "0",
          "exited": "0",
          "cdate": "2026-11-08T01:14:24-06:00",
          "mdate": "2026-11-08T01:14:24-06:00"
        }
      ],
      "total": 1,
      "offset": 0,
      "limit": 20,
      "hasMore": false
    }
  },
  "list_contact_custom_fields": {
    "action": "activecampaign_list_contact_custom_fields",
    "output": {
      "items": [
        {
          "id": "1",
          "title": "Preferred Language",
          "type": "dropdown",
          "perstag": "PREFERRED_LANGUAGE",
          "options": [
            {
              "value": "af",
              "label": "Afrikaans"
            },
            {
              "value": "sq",
              "label": "Albanian"
            },
            {
              "value": "am",
              "label": "Amharic"
            },
            {
              "value": "ar",
              "label": "Arabic"
            },
            {
              "value": "hy",
              "label": "Armenian"
            },
            {
              "value": "az",
              "label": "Azerbaijani"
            },
            {
              "value": "bn",
              "label": "Bengali"
            },
            {
              "value": "bs",
              "label": "Bosnian"
            },
            {
              "value": "bg",
              "label": "Bulgarian"
            },
            {
              "value": "fr-CA",
              "label": "Canadian French"
            },
            {
              "value": "ca",
              "label": "Catalan"
            },
            {
              "value": "zh",
              "label": "Chinese"
            },
            {
              "value": "zh-TW",
              "label": "Chinese Traditional"
            },
            {
              "value": "hr",
              "label": "Croatian"
            },
            {
              "value": "cs",
              "label": "Czech"
            },
            {
              "value": "da",
              "label": "Danish"
            },
            {
              "value": "fa-AF",
              "label": "Dari"
            },
            {
              "value": "nl",
              "label": "Dutch"
            },
            {
              "value": "en",
              "label": "English"
            },
            {
              "value": "et",
              "label": "Estonian"
            },
            {
              "value": "fi",
              "label": "Finnish"
            },
            {
              "value": "fr",
              "label": "French"
            },
            {
              "value": "ka",
              "label": "Georgian"
            },
            {
              "value": "de",
              "label": "German"
            },
            {
              "value": "el",
              "label": "Greek"
            },
            {
              "value": "gu",
              "label": "Gujarati"
            },
            {
              "value": "ht",
              "label": "Haitian Creole"
            },
            {
              "value": "ha",
              "label": "Hausa"
            },
            {
              "value": "he",
              "label": "Hebrew"
            },
            {
              "value": "hi",
              "label": "Hindi"
            },
            {
              "value": "hu",
              "label": "Hungarian"
            },
            {
              "value": "is",
              "label": "Icelandic"
            },
            {
              "value": "id",
              "label": "Indonesian"
            },
            {
              "value": "ga",
              "label": "Irish"
            },
            {
              "value": "it",
              "label": "Italian"
            },
            {
              "value": "ja",
              "label": "Japanese"
            },
            {
              "value": "kn",
              "label": "Kannada"
            },
            {
              "value": "kk",
              "label": "Kazakh"
            },
            {
              "value": "ko",
              "label": "Korean"
            },
            {
              "value": "lv",
              "label": "Latvian"
            },
            {
              "value": "lt",
              "label": "Lithuanian"
            },
            {
              "value": "mk",
              "label": "Macedonian"
            },
            {
              "value": "ms",
              "label": "Malay"
            },
            {
              "value": "ml",
              "label": "Malayalam"
            },
            {
              "value": "mt",
              "label": "Maltese"
            },
            {
              "value": "mr",
              "label": "Marathi"
            },
            {
              "value": "es-MX",
              "label": "Mexican Spanish"
            },
            {
              "value": "mn",
              "label": "Mongolian"
            },
            {
              "value": "no",
              "label": "Norwegian"
            },
            {
              "value": "ps",
              "label": "Pashto"
            },
            {
              "value": "fa",
              "label": "Persian"
            },
            {
              "value": "pl",
              "label": "Polish"
            },
            {
              "value": "pt-PT",
              "label": "Portugal Portuguese"
            },
            {
              "value": "pt",
              "label": "Portuguese"
            },
            {
              "value": "pa",
              "label": "Punjabi"
            },
            {
              "value": "ro",
              "label": "Romanian"
            },
            {
              "value": "ru",
              "label": "Russian"
            },
            {
              "value": "sr",
              "label": "Serbian"
            },
            {
              "value": "si",
              "label": "Sinhala"
            },
            {
              "value": "sk",
              "label": "Slovak"
            },
            {
              "value": "sl",
              "label": "Slovenian"
            },
            {
              "value": "so",
              "label": "Somali"
            },
            {
              "value": "es",
              "label": "Spanish"
            },
            {
              "value": "sw",
              "label": "Swahili"
            },
            {
              "value": "sv",
              "label": "Swedish"
            },
            {
              "value": "tl",
              "label": "Tagalog"
            },
            {
              "value": "ta",
              "label": "Tamil"
            },
            {
              "value": "te",
              "label": "Telugu"
            },
            {
              "value": "th",
              "label": "Thai"
            },
            {
              "value": "tr",
              "label": "Turkish"
            },
            {
              "value": "uk",
              "label": "Ukrainian"
            },
            {
              "value": "ur",
              "label": "Urdu"
            },
            {
              "value": "uz",
              "label": "Uzbek"
            },
            {
              "value": "vi",
              "label": "Vietnamese"
            },
            {
              "value": "cy",
              "label": "Welsh"
            }
          ]
        }
      ],
      "total": 1
    }
  },
  "list_contacts": {
    "action": "activecampaign_list_contacts",
    "output": {
      "items": [
        {
          "id": "1",
          "email": "owner@example.com",
          "firstName": "",
          "lastName": "",
          "phone": "",
          "cdate": "2026-11-08T01:14:52-06:00",
          "udate": "2026-11-08T01:14:59-06:00",
          "orgid": "0"
        },
        {
          "id": "2",
          "email": "apqa1@example.com",
          "firstName": "QA2",
          "lastName": "Trig",
          "phone": "+15550001",
          "cdate": "2026-11-08T01:30:31-06:00",
          "udate": "2026-11-08T01:41:02-06:00",
          "orgid": "1"
        },
        {
          "id": "3",
          "email": "apqa2@example.com",
          "firstName": "QA",
          "lastName": "Two-Upd",
          "phone": "",
          "cdate": "2026-11-08T01:32:16-06:00",
          "udate": "2026-11-08T01:36:50-06:00",
          "orgid": "2"
        }
      ],
      "total": 3,
      "offset": 0,
      "limit": 20,
      "hasMore": false
    }
  },
  "list_deal_stages": {
    "action": "activecampaign_list_deal_stages",
    "output": {
      "items": [],
      "total": 0
    }
  },
  "list_deals": {
    "action": "activecampaign_list_deals",
    "output": {
      "items": [
        {
          "id": "1",
          "title": "QA Deal AI",
          "description": "ai deal",
          "currency": "usd",
          "group": "1",
          "stage": "2",
          "owner": "1",
          "contact": "2",
          "account": null,
          "cdate": "2026-11-08T05:15:12-06:00",
          "mdate": "2026-11-08T05:15:17-06:00",
          "isDisabled": false,
          "value": "29",
          "valueFormatted": "0.29",
          "status": "open"
        }
      ],
      "total": 1,
      "offset": 0,
      "limit": 20,
      "hasMore": false
    }
  },
  "list_lists": {
    "action": "activecampaign_list_lists",
    "output": {
      "items": [
        {
          "id": "3",
          "name": "Master Contact List",
          "stringid": "master-contact-list",
          "cdate": "2026-11-08T01:14:53-06:00"
        }
      ],
      "total": 1,
      "offset": 0,
      "limit": 20,
      "hasMore": false
    }
  },
  "list_pipelines": {
    "action": "activecampaign_list_pipelines",
    "output": {
      "items": [],
      "total": 0
    }
  },
  "list_tags": {
    "action": "activecampaign_list_tags",
    "output": {
      "items": [
        {
          "id": "1",
          "tag": "ap-qa-tag",
          "tagType": "contact",
          "description": "qa",
          "cdate": "2026-11-08T01:30:39-06:00"
        }
      ],
      "total": 1,
      "offset": 0,
      "limit": 20,
      "hasMore": false
    }
  },
  "list_task_types": {
    "action": "activecampaign_list_task_types",
    "output": {
      "items": [
        {
          "id": "1",
          "title": "Call"
        },
        {
          "id": "2",
          "title": "Email"
        },
        {
          "id": "3",
          "title": "Lunch"
        },
        {
          "id": "4",
          "title": "Meeting"
        }
      ],
      "total": 4
    }
  },
  "list_users": {
    "action": "activecampaign_list_users",
    "output": {
      "items": [
        {
          "id": "1",
          "username": "admin",
          "firstName": "Alex",
          "lastName": "Owner",
          "email": "owner@example.com"
        }
      ],
      "total": 1
    }
  },
  "remove_contact_from_automation": {
    "action": "activecampaign_remove_contact_from_automation",
    "output": {
      "removed": false,
      "contactId": "2",
      "automationId": "1",
      "contactAutomationIds": []
    }
  },
  "remove_contact_from_automation_active": {
    "action": "activecampaign_remove_contact_from_automation",
    "output": {
      "removed": true,
      "contactId": "2",
      "automationId": "1",
      "contactAutomationIds": [
        "1",
        "2"
      ]
    }
  },
  "remove_contact_from_automation_human_cleanup": {
    "action": "activecampaign_remove_contact_from_automation",
    "output": {
      "removed": true,
      "contactId": "3",
      "automationId": "1",
      "contactAutomationIds": [
        "3"
      ]
    }
  },
  "remove_contact_from_automation_repeat": {
    "action": "activecampaign_remove_contact_from_automation",
    "output": {
      "removed": false,
      "contactId": "2",
      "automationId": "1",
      "contactAutomationIds": []
    }
  },
  "remove_tag_from_contact": {
    "action": "activecampaign_remove_tag_from_contact",
    "output": {
      "removed": true,
      "contactId": "3",
      "tagId": "1"
    }
  },
  "subscribe_contact_to_list": {
    "action": "activecampaign_subscribe_contact_to_list",
    "output": {
      "contactId": "3",
      "listId": "3",
      "status": "subscribed",
      "contactList": {
        "id": "3",
        "list": "3",
        "contact": "3",
        "status": "1",
        "sdate": "2026-11-08T01:46:39-06:00",
        "udate": null,
        "sourceid": "4"
      }
    }
  },
  "unsubscribe_contact_from_list": {
    "action": "activecampaign_unsubscribe_contact_from_list",
    "output": {
      "contactId": "3",
      "listId": "3",
      "status": "unsubscribed",
      "contactList": {
        "id": "3",
        "list": "3",
        "contact": "3",
        "status": "2",
        "sdate": "2026-11-08T01:46:39-06:00",
        "udate": "2026-11-08T01:46:41-06:00",
        "sourceid": "4"
      }
    }
  },
  "update_account_ai": {
    "action": "activecampaign_update_account_ai",
    "output": {
      "id": "1",
      "name": "AP QA Corp",
      "accountUrl": "https://example.org",
      "createdTimestamp": "2026-11-08T01:31:19-06:00",
      "updatedTimestamp": "2026-11-08T01:46:44-06:00",
      "fields": []
    }
  },
  "update_deal": {
    "action": "activecampaign_update_deal",
    "output": {
      "deal": {
        "id": "1",
        "title": "QA Deal AI",
        "description": "ai deal",
        "currency": "usd",
        "group": "1",
        "stage": "2",
        "owner": "1",
        "contact": "2",
        "account": null,
        "cdate": "2026-11-08T05:15:12-06:00",
        "mdate": "2026-11-08T05:15:17-06:00",
        "isDisabled": false,
        "value": "29",
        "valueFormatted": "0.29",
        "status": "open"
      }
    }
  }
};
