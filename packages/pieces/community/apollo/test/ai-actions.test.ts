import { afterEach, describe, expect, test, vi } from 'vitest';
import { aiSearchPeopleAction } from '../src/lib/actions/ai/search-people';
import { aiEnrichPersonAction } from '../src/lib/actions/ai/enrich-person';
import { aiSearchOrganizationsAction } from '../src/lib/actions/ai/search-organizations';
import { aiEnrichOrganizationAction } from '../src/lib/actions/ai/enrich-organization';
import { aiListJobPostingsAction } from '../src/lib/actions/ai/list-job-postings';
import { aiSearchNewsAction } from '../src/lib/actions/ai/search-news';
import { aiGetCreditUsageAction } from '../src/lib/actions/ai/get-credit-usage';
import { aiSearchContactsAction } from '../src/lib/actions/ai/search-contacts';
import { aiCreateContactAction } from '../src/lib/actions/ai/create-contact';
import { aiUpdateContactAction } from '../src/lib/actions/ai/update-contact';
import { aiAddToListAction } from '../src/lib/actions/ai/add-to-list';
import { aiRemoveFromListAction } from '../src/lib/actions/ai/remove-from-list';
import { aiListListsAction } from '../src/lib/actions/ai/list-lists';
import { aiListEmailAccountsAction } from '../src/lib/actions/ai/list-email-accounts';
import { aiAddContactsToSequenceAction } from '../src/lib/actions/ai/add-contacts-to-sequence';
import { aiRemoveContactsFromSequenceAction } from '../src/lib/actions/ai/remove-contacts-from-sequence';
import { aiCreateTaskAction } from '../src/lib/actions/ai/create-task';
import { aiCreateDealAction } from '../src/lib/actions/ai/create-deal';
import { aiUpdateDealAction } from '../src/lib/actions/ai/update-deal';
import { aiListDealsAction } from '../src/lib/actions/ai/list-deals';
import { aiSearchTasksAction } from '../src/lib/actions/ai/search-tasks';
import { aiSearchOutreachEmailsAction } from '../src/lib/actions/ai/search-outreach-emails';
import { aiGetEmailContentAction } from '../src/lib/actions/ai/get-email-content';
import { aiSearchCallsAction } from '../src/lib/actions/ai/search-calls';
import { aiListCustomFieldsAction } from '../src/lib/actions/ai/list-custom-fields';
import { apolloInputs } from '../src/lib/common/ai-props';
import { peopleSearch } from '../src/lib/actions/people-search';
import { organizationSearch } from '../src/lib/actions/organization-search';
import { fixtures } from './fixtures';
import { replies, runContext, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('prospecting atomics', () => {
  test('search people sends the documented domain param and maps results with has_more', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: fixtures.peopleSearch }] }) });
    const output = await aiSearchPeopleAction.run(runContext({ props: { organization_domains: ['apollo.io'], person_titles: ['ceo'], per_page: 1 } }));
    expect(seen[0].path).toBe('/api/v1/mixed_people/api_search');
    expect(seen[0].query.getAll('q_organization_domains_list[]')).toEqual(['apollo.io']);
    expect(seen[0].query.has('q_organization_domains[]')).toBe(false);
    expect(seen[0].query.get('page')).toBe('1');
    expect(seen[0].query.get('per_page')).toBe('1');
    expect(output.total_entries).toBe(232764882);
    expect(output.has_more).toBe(true);
    expect(output.people[0]).toMatchObject({ id: '67bdafd0c3a4c50001bbd7c2', organization_name: 'Scicomm Media' });
  });

  test('enrich person requires a strong identifier or name with employer', async () => {
    await expect(aiEnrichPersonAction.run(runContext({ props: { name: 'Tim Zheng' } }))).rejects.toThrow('Full Name together with');
    const seen = stubFetch({ respond: replies({ list: [{ body: { person: fixtures.person } }] }) });
    const output = await aiEnrichPersonAction.run(runContext({ props: { name: 'Tim Zheng', domain: 'apollo.io', reveal_personal_emails: 'no' } }));
    expect(seen[0].method).toBe('POST');
    expect(seen[0].query.get('name')).toBe('Tim Zheng');
    expect(seen[0].query.get('domain')).toBe('apollo.io');
    expect(seen[0].query.has('reveal_personal_emails')).toBe(false);
    expect(output).toMatchObject({ found: true, match_confidence: 'high', person: { id: fixtures.person.id, organization_domain: 'apollo.io' } });
  });

  test('enrich person reports found=false on no match', async () => {
    stubFetch({ respond: replies({ list: [{ body: {} }] }) });
    expect(await aiEnrichPersonAction.run(runContext({ props: { email: 'nobody@example.com' } }))).toEqual({ found: false, match_confidence: null, person: null });
  });

  test('search organizations merges saved accounts and organizations with both IDs', async () => {
    stubFetch({ respond: replies({ list: [{ body: { accounts: [{ ...fixtures.account, organization_id: 'org-a' }], organizations: [fixtures.organization], pagination: { page: 1, per_page: 25, total_entries: 2, total_pages: 1 } } }] }) });
    const output = await aiSearchOrganizationsAction.run(runContext({ props: { name: 'Apollo' } }));
    expect(output.organizations.map((item) => [item['organization_id'], item['account_id']])).toEqual([
      ['org-a', fixtures.account.id],
      [fixtures.organization.id, fixtures.organization.account_id],
    ]);
    expect(output.has_more).toBe(false);
  });

  test('enrich organization uses GET /organizations/{id} or /organizations/enrich, never both', async () => {
    await expect(aiEnrichOrganizationAction.run(runContext({ props: { organization_id: 'o1', domain: 'x.com' } }))).rejects.toThrow('not both');
    await expect(aiEnrichOrganizationAction.run(runContext({ props: { name: 'Apollo' } }))).rejects.toThrow('Give an Organization ID');
    const seen = stubFetch({ respond: replies({ list: [{ body: { organization: fixtures.organization } }] }) });
    await aiEnrichOrganizationAction.run(runContext({ props: { organization_id: 'o 1' } }));
    expect(seen[0].path).toBe('/api/v1/organizations/o%201');
    const output = await aiEnrichOrganizationAction.run(runContext({ props: { domain: 'apollo.io' } }));
    expect(seen[1].path).toBe('/api/v1/organizations/enrich');
    expect(output.organization?.['phone']).toBe('+1 415-763-6055');
  });

  test('employee ranges are never split on their comma (AI and human paths)', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: fixtures.peopleSearch }] }) });
    await aiSearchPeopleAction.run(runContext({ props: { organization_num_employees_ranges: '1,10' } }));
    expect(seen[0].query.getAll('organization_num_employees_ranges[]')).toEqual(['1,10']);
    await aiSearchOrganizationsAction.run(runContext({ props: { employee_ranges: ['1,10', '250,500'] } }));
    expect(seen[1].query.getAll('organization_num_employees_ranges[]')).toEqual(['1,10', '250,500']);
    await peopleSearch.run(runContext({ props: { organization_num_employees_ranges: '1,10', person_locations: 'Austin, Texas' } }));
    expect(seen[2].query.getAll('organization_num_employees_ranges[]')).toEqual(['1,10']);
    expect(seen[2].query.getAll('person_locations[]')).toEqual(['Austin, Texas']);
    await organizationSearch.run(runContext({ props: { organization_num_employees_ranges: ['1,10', '11,50'] } }));
    expect(seen[3].query.getAll('organization_num_employees_ranges[]')).toEqual(['1,10', '11,50']);
  });

  test('job postings has_more follows a full page', async () => {
    stubFetch({ respond: replies({ list: [{ body: { organization_job_postings: [{ id: 'j1' }, { id: 'j2' }] } }] }) });
    expect(await aiListJobPostingsAction.run(runContext({ props: { organization_id: 'o1', per_page: 2 } }))).toMatchObject({ has_more: true, page: 1, per_page: 2 });
  });

  test('news search validates dates strictly', async () => {
    await expect(aiSearchNewsAction.run(runContext({ props: { organization_ids: ['o1'], published_after: '2026-02-30' } }))).rejects.toThrow('real calendar date');
    await expect(aiSearchNewsAction.run(runContext({ props: { organization_ids: ['o1'], per_page: 26 } }))).rejects.toThrow('between 1 and 25');
  });

  test('credit usage maps the profile', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { id: 'u1', team_id: 't1', first_name: 'Odai', last_name: 'A', email: 'o@example.com', num_credits_remaining: 90, num_lead_credits_used: 10 } }] }) });
    const output = await aiGetCreditUsageAction.run(runContext({}));
    expect(seen[0].query.get('include_credit_usage')).toBe('true');
    expect(output).toMatchObject({ user_id: 'u1', name: 'Odai A', credits: { remaining: 90, lead_used: 10, ai_used: null } });
  });
});

describe('CRM atomics', () => {
  test('search contacts sends a JSON body and sort only when chosen', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { contacts: [fixtures.contact], pagination: { page: 1, per_page: 25, total_entries: 1, total_pages: 1 } } }] }) });
    const output = await aiSearchContactsAction.run(runContext({ props: { keywords: 'jane', list_ids: ['l1'], sort_ascending: 'yes' } }));
    expect(seen[0].body).toEqual({ q_keywords: 'jane', contact_label_ids: ['l1'], page: 1, per_page: 25 });
    expect(output.contacts[0]).toMatchObject({ id: fixtures.contact.id, list_ids: fixtures.contact.label_ids, phone: '+15125550100' });
  });

  test('create contact maps if_match_exists to run_dedupe and reports dedupe', async () => {
    await expect(aiCreateContactAction.run(runContext({ props: { if_match_exists: 'maybe', email: 'a@b.c' } }))).rejects.toThrow('update_existing or always_create');
    const seen = stubFetch({ respond: replies({ list: [{ body: { contact: fixtures.contact, was_existing: true, labels: [] } }, { body: { contact: fixtures.contact, was_existing: false, labels: [] } }] }) });
    const output = await aiCreateContactAction.run(runContext({ props: { if_match_exists: 'update_existing', email: 'jane@example.com', list_names: [] } }));
    expect(seen[0].body).toEqual({ email: 'jane@example.com', run_dedupe: true });
    expect(output).toEqual(expect.objectContaining({ created: false, dedupe: { found_existing: true, existing_contact_id: fixtures.contact.id } }));
    const fresh = await aiCreateContactAction.run(runContext({ props: { if_match_exists: 'update_existing', email: 'new@example.com' } }));
    expect(fresh).toEqual(expect.objectContaining({ created: true, dedupe: { found_existing: false, existing_contact_id: null } }));
    stubFetch({ respond: replies({ list: [{ body: { contact: fixtures.contact } }] }) });
    expect(await aiCreateContactAction.run(runContext({ props: { if_match_exists: 'always_create', email: 'x@y.z' } }))).toMatchObject({ created: true, dedupe: null });
  });

  test('update contact ignores empty agent-filled values', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { contact: fixtures.contact } }] }) });
    await aiUpdateContactAction.run(runContext({ props: { contact_id: 'c1', title: 'CTO', email: '', typed_custom_fields: {} } }));
    expect(seen[0].body).toEqual({ title: 'CTO' });
  });

  test('add to list resolves the name, refuses unknown names and reads the count back', async () => {
    const seen = stubFetch({
      respond: (request) => {
        if (request.method === 'GET') {
          return { body: fixtures.lists };
        }
        return { body: { labels: [fixtures.lists[0]] } };
      },
    });
    await expect(aiAddToListAction.run(runContext({ props: { list: 'Evnt leads', modality: 'contacts', record_ids: ['c1'] } }))).rejects.toThrow('No contacts list');
    expect(seen.filter((request) => request.method === 'POST')).toHaveLength(0);
    await expect(aiAddToListAction.run(runContext({ props: { list: fixtures.lists[1].id, modality: 'contacts', record_ids: ['c1'] } }))).rejects.toThrow('holds accounts');
    const output = await aiAddToListAction.run(runContext({ props: { list: 'event LEADS', modality: 'contacts', record_ids: ['c1', 'c2'] } }));
    const post = seen.find((request) => request.method === 'POST');
    expect(post?.path).toBe('/api/v1/labels/add_entity_ids_to_label_names');
    expect(post?.body).toEqual({ entity_ids: ['c1', 'c2'], label_names: ['Event leads'], modality: 'contacts', async: false });
    expect(output).toEqual({ list: expect.objectContaining({ id: fixtures.lists[0].id, cached_count: 3 }), modality: 'contacts', requested_ids: ['c1', 'c2'] });
  });

  test('remove from list uses the remove endpoint', async () => {
    const seen = stubFetch({ respond: (request) => (request.method === 'GET' ? { body: fixtures.lists } : { body: {} }) });
    await aiRemoveFromListAction.run(runContext({ props: { list: fixtures.lists[0].id, modality: 'contacts', record_ids: ['c1'] } }));
    expect(seen.find((request) => request.method === 'POST')?.path).toBe('/api/v1/labels/remove_entity_ids_from_label_names');
  });

  test('list lists filters by modality', async () => {
    stubFetch({ respond: replies({ list: [{ body: fixtures.lists }] }) });
    const output = await aiListListsAction.run(runContext({ props: { modality: 'accounts' } }));
    expect(output.lists.map((list) => list['name'])).toEqual(['Target accounts']);
  });

  test('email accounts never expose provider secrets', async () => {
    stubFetch({ respond: replies({ list: [{ body: { email_accounts: [fixtures.emailAccount] } }] }) });
    const output = await aiListEmailAccountsAction.run(runContext({}));
    const text = JSON.stringify(output);
    expect(text).not.toContain('SG.secret');
    expect(text).not.toContain('apikey-user');
    expect(text).not.toContain('mg.example.com');
    expect(output.email_accounts[0]).toMatchObject({ id: fixtures.emailAccount.id, email: 'sales@example.com' });
  });

  test('add contacts to sequence fails when nothing was added for a blocking reason', async () => {
    stubFetch({ respond: replies({ list: [{ body: { contacts: [], skipped_contact_ids: { c1: 'contact_has_no_email' } } }] }) });
    await expect(aiAddContactsToSequenceAction.run(runContext({ props: { sequence_id: 's1', contact_ids: ['c1'], email_account_id: 'e1', status: 'paused' } }))).rejects.toThrow('added none of the contacts');
  });

  test('add contacts to sequence succeeds when the only skip is "already in sequence"', async () => {
    stubFetch({ respond: replies({ list: [{ body: { contacts: [], skipped_contact_ids: { c1: 'contacts_already_exists_in_current_campaign' } } }] }) });
    const output = await aiAddContactsToSequenceAction.run(runContext({ props: { sequence_id: 's1', contact_ids: ['c1'], email_account_id: 'e1', status: 'active' } }));
    expect(output).toEqual({ sequence_id: 's1', status: 'active', added_contact_ids: [], skipped: [{ contact_id: 'c1', reason: 'contacts_already_exists_in_current_campaign', already_in_sequence: true }] });
  });

  test('add contacts to sequence requires an explicit status', async () => {
    await expect(aiAddContactsToSequenceAction.run(runContext({ props: { sequence_id: 's1', contact_ids: ['c1'], email_account_id: 'e1' } }))).rejects.toThrow('Initial Status is required');
  });

  test('remove contacts from sequence sends array params and the mode', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { entity_progress_job: { id: 'job1' } } }] }) });
    const output = await aiRemoveContactsFromSequenceAction.run(runContext({ props: { sequence_ids: ['s1'], contact_ids: ['c1'], mode: 'stop' } }));
    expect(seen[0].path).toBe('/api/v1/emailer_campaigns/remove_or_stop_contact_ids');
    expect(seen[0].query.getAll('emailer_campaign_ids[]')).toEqual(['s1']);
    expect(seen[0].query.get('mode')).toBe('stop');
    expect(output.job_id).toBe('job1');
  });

  test('create task needs a strict ISO date-time with zone', async () => {
    await expect(aiCreateTaskAction.run(runContext({ props: { contact_id: 'c1', user_id: 'u1', type: 'call', due_at: '2026-11-20 15:00' } }))).rejects.toThrow('ISO 8601');
    const seen = stubFetch({ respond: replies({ list: [{ body: { task: fixtures.task } }] }) });
    await aiCreateTaskAction.run(runContext({ props: { contact_id: 'c1', user_id: 'u1', type: 'call', due_at: '2026-11-20T17:00:00+02:00', priority: 'high' } }));
    expect(seen[0].body).toEqual({ contact_id: 'c1', user_id: 'u1', type: 'call', status: 'scheduled', due_at: '2026-11-20T15:00:00.000Z', priority: 'high' });
  });

  test('create and update deal send stage, amount and date in Apollo field names', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { opportunity: fixtures.deal } }] }) });
    await aiCreateDealAction.run(runContext({ props: { name: 'Renewal', amount: '15000', stage_id: 'st1', closed_date: '2026-12-31' } }));
    expect(seen[0].body).toEqual({ name: 'Renewal', amount: '15000', opportunity_stage_id: 'st1', closed_date: '2026-12-31' });
    await aiUpdateDealAction.run(runContext({ props: { deal_id: 'd1', stage_id: 'st2' } }));
    expect(seen[1].method).toBe('PATCH');
    expect(seen[1].path).toBe('/api/v1/opportunities/d1');
    expect(seen[1].body).toEqual({ opportunity_stage_id: 'st2' });
    await expect(aiUpdateDealAction.run(runContext({ props: { deal_id: 'd1' } }))).rejects.toThrow('at least one field');
  });

  test('list deals and search tasks use the documented methods', async () => {
    const seen = stubFetch({ respond: (request) => (request.path.endsWith('opportunities/search') ? { body: { opportunities: [fixtures.deal], pagination: { total_entries: 1, total_pages: 1 } } } : { body: { tasks: [fixtures.task] } }) });
    await aiListDealsAction.run(runContext({ props: { sort_by: 'amount' } }));
    await aiSearchTasksAction.run(runContext({ props: { sort_by: 'task_due_at' } }));
    expect(seen.map((request) => `${request.method} ${request.path}`)).toEqual(['GET /api/v1/opportunities/search', 'POST /api/v1/tasks/search']);
    expect(seen[0].query.get('sort_by_field')).toBe('amount');
  });

  test('outreach email search needs a date field with a range', async () => {
    await expect(aiSearchOutreachEmailsAction.run(runContext({ props: { date_from: '2026-11-01' } }))).rejects.toThrow('Date Field');
    const seen = stubFetch({ respond: replies({ list: [{ body: { emailer_messages: [{ id: 'm1', subject: 'Hi', body_text: 'hidden' }] } }] }) });
    const output = await aiSearchOutreachEmailsAction.run(runContext({ props: { statuses: ['delivered'], date_mode: 'completed_at', date_from: '2026-11-01' } }));
    expect(seen[0].method).toBe('GET');
    expect(seen[0].query.get('emailer_message_date_range_mode')).toBe('completed_at');
    expect(JSON.stringify(output)).not.toContain('hidden');
  });

  test('email content returns an empty list for a draft and says so in its metadata', async () => {
    stubFetch({ respond: replies({ list: [{ body: { emailer_messages: [] } }] }) });
    expect(await aiGetEmailContentAction.run(runContext({ props: { email_ids: ['draft1'] } }))).toEqual({ emails: [] });
    expect(aiGetEmailContentAction.aiMetadata?.description).toContain('Drafts are never returned');
  });

  test('ai add contacts to sequence: a repeat add into the same sequence succeeds via the membership lookup', async () => {
    stubFetch({
      respond: (request) =>
        request.method === 'GET'
          ? { body: { contact: { ...fixtures.contact, id: 'c1', emailer_campaign_ids: ['s1'] } } }
          : { body: { contacts: [], skipped_contact_ids: { c1: 'contacts_active_in_other_campaigns' } } },
    });
    const output = await aiAddContactsToSequenceAction.run(runContext({ props: { sequence_id: 's1', contact_ids: ['c1'], email_account_id: 'e1', status: 'paused' } }));
    expect(output.skipped).toEqual([{ contact_id: 'c1', reason: 'contacts_active_in_other_campaigns', already_in_sequence: true }]);
  });

  test('email content caps ids at 10', async () => {
    await expect(aiGetEmailContentAction.run(runContext({ props: { email_ids: Array.from({ length: 11 }, (_, index) => `m${index}`) } }))).rejects.toThrow('at most 10');
  });

  test('search calls maps direction and dates', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { phone_calls: [{ id: 'p1' }], pagination: { total_entries: 1, total_pages: 1 } } }] }) });
    await aiSearchCallsAction.run(runContext({ props: { direction: 'outgoing', date_from: '2026-11-01' } }));
    expect(seen[0].path).toBe('/api/v1/phone_calls/search');
    expect(seen[0].query.get('inbound')).toBe('outgoing');
    expect(seen[0].query.get('date_range[min]')).toBe('2026-11-01');
  });

  test('custom fields are requested with source=custom and filtered by record type', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { fields: [{ id: 'f1', label: 'A', modality: 'contact' }, { id: 'f2', label: 'B', modality: 'account' }] } }] }) });
    const output = await aiListCustomFieldsAction.run(runContext({ props: { modality: 'account' } }));
    expect(seen[0].query.get('source')).toBe('custom');
    expect(output.fields.map((field) => field['id'])).toEqual(['f2']);
  });
});

describe('input validators', () => {
  test('dates, amounts and custom fields', () => {
    expect(apolloInputs.ymdDate({ value: '2024-02-29', label: 'D' })).toBe('2024-02-29');
    expect(() => apolloInputs.ymdDate({ value: '2023-02-29', label: 'D' })).toThrow('real calendar date');
    expect(() => apolloInputs.isoDateTime({ value: '2026-11-31T10:00:00Z', label: 'T' })).toThrow('ISO 8601');
    expect(apolloInputs.decimalAmount({ value: 15000.5, label: 'A' })).toBe('15000.5');
    expect(() => apolloInputs.decimalAmount({ value: '1,000', label: 'A' })).toThrow('plain number');
    expect(apolloInputs.customFields('{"f1": "x", "f2": ["a"]}')).toEqual({ f1: 'x', f2: ['a'] });
    expect(apolloInputs.customFields({})).toBeUndefined();
    expect(() => apolloInputs.customFields({ f1: { nested: true } })).toThrow('must be a string');
    expect(apolloInputs.stringList('1,10')).toEqual(['1,10']);
    expect(apolloInputs.stringList('Austin, Texas')).toEqual(['Austin, Texas']);
    expect(apolloInputs.stringList('["1,10", "250,500", "1,10"]')).toEqual(['1,10', '250,500']);
    expect(apolloInputs.stringList(['a', ' ', 'a', 'b'])).toEqual(['a', 'b']);
    expect(apolloInputs.stringList('[not json')).toEqual(['[not json']);
  });
});

describe('QA edge cases', () => {
  test('create contact with always_create sends run_dedupe false and reports created', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { contact: fixtures.contact } }] }) });
    const output = await aiCreateContactAction.run(runContext({ props: { if_match_exists: 'always_create', email: 'a@b.c' } }));
    expect(Reflect.get(Object(seen[0].body), 'run_dedupe')).toBe(false);
    expect(output['created']).toBe(true);
    expect(output['dedupe']).toBeNull();
  });

  test('numeric Apollo ids come back as strings', async () => {
    stubFetch({ respond: replies({ list: [{ body: { contacts: [{ ...fixtures.contact, id: 123, owner_id: 456, label_ids: [7, 'x'] }] } }] }) });
    const output = await aiSearchContactsAction.run(runContext({ props: {} }));
    const contact = Object(output['contacts'])[0];
    expect(contact['id']).toBe('123');
    expect(contact['owner_id']).toBe('456');
    expect(contact['list_ids']).toEqual(['7', 'x']);
  });

  test('news search refuses a reversed date range before any request', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: {} }] }) });
    await expect(aiSearchNewsAction.run(runContext({ props: { organization_ids: ['o1'], published_after: '2026-11-09', published_before: '2026-11-01' } }))).rejects.toThrow('must not be later');
    expect(seen).toHaveLength(0);
  });
});
