import { afterEach, describe, expect, test, vi } from 'vitest';
import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';
import { apollo } from '../src/index';
import { fixtures } from './fixtures';
import { FakeReply, SeenRequest, runContext, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

const actions = Object.values(apollo.actions());
const triggers = Object.values(apollo.triggers());
const ORIGINAL_ACTIONS = ['matchPerson', 'enrichCompany', 'peopleSearch', 'organizationSearch', 'newsArticlesSearch', 'organizationJobPostings'];
const TIER_B_ACTIONS = ['create_contact', 'update_contact', 'find_contact', 'create_account', 'update_account', 'create_deal', 'create_task', 'add_contact_to_sequence'];

function score({ fields, value, path }: { fields: OutputSchemaField[]; value: unknown; path: string }): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return [];
  }
  const keys = Object.keys(value);
  const modelled = fields.map((field) => field.value ?? field.key);
  const problems = [
    ...modelled.filter((key) => key !== '' && !keys.includes(key)).map((key) => `dead ${path}${key}`),
    ...keys.filter((key) => !modelled.includes(key)).map((key) => `unmodelled ${path}${key}`),
  ];
  for (const field of fields) {
    const child: unknown = Reflect.get(value, field.value ?? field.key);
    if (field.children) {
      problems.push(...score({ fields: field.children, value: child, path: `${path}${field.key}.` }));
    }
    if (field.listItems && Array.isArray(child)) {
      for (const item of child) {
        problems.push(...score({ fields: field.listItems, value: item, path: `${path}${field.key}[].` }));
      }
    }
  }
  return problems;
}

function byName({ name }: { name: string }) {
  const found = actions.find((action) => action.name === name);
  if (!found) {
    throw new Error(`no action ${name}`);
  }
  return found;
}

const SCORED: { name: string; props: Record<string, unknown>; reply: (request: SeenRequest) => FakeReply }[] = [
  { name: 'ai_search_people', props: {}, reply: () => ({ body: fixtures.peopleSearch }) },
  { name: 'ai_enrich_person', props: { email: 'tim@apollo.io' }, reply: () => ({ body: { person: fixtures.person } }) },
  { name: 'ai_search_organizations', props: {}, reply: () => ({ body: { organizations: [fixtures.organization], accounts: [], pagination: { total_entries: 1, total_pages: 1 } } }) },
  { name: 'ai_enrich_organization', props: { domain: 'apollo.io' }, reply: () => ({ body: { organization: fixtures.organization } }) },
  { name: 'ai_list_job_postings', props: { organization_id: 'o1' }, reply: () => ({ body: { organization_job_postings: [{ id: 'j1', title: 'AE', url: 'https://x', city: null, state: null, country: null, posted_at: null, last_seen_at: null }] } }) },
  { name: 'ai_search_news', props: { organization_ids: ['o1'] }, reply: () => ({ body: { news_articles: [{ id: 'n1' }], pagination: { total_entries: 1, total_pages: 1 } } }) },
  { name: 'ai_get_credit_usage', props: {}, reply: () => ({ body: { id: 'u1' } }) },
  { name: 'ai_search_contacts', props: {}, reply: () => ({ body: { contacts: [fixtures.contact] } }) },
  { name: 'ai_find_contact_by_email', props: { email: 'jane@example.com' }, reply: () => ({ body: { contacts: [fixtures.contact] } }) },
  { name: 'ai_get_contact', props: { contact_id: 'c1' }, reply: () => ({ body: { contact: fixtures.contact } }) },
  { name: 'ai_create_contact', props: { if_match_exists: 'update_existing', email: 'a@b.c' }, reply: () => ({ body: { contact: fixtures.contact, was_existing: false, labels: [] } }) },
  { name: 'ai_update_contact', props: { contact_id: 'c1', title: 'x' }, reply: () => ({ body: { contact: fixtures.contact } }) },
  { name: 'ai_list_contact_stages', props: {}, reply: () => ({ body: { contact_stages: [{ id: 's1', name: 'Cold' }] } }) },
  { name: 'ai_search_accounts', props: {}, reply: () => ({ body: { accounts: [fixtures.account] } }) },
  { name: 'ai_get_account', props: { account_id: 'a1' }, reply: () => ({ body: { account: fixtures.account } }) },
  { name: 'ai_create_account', props: { name: 'X' }, reply: () => ({ body: { account: fixtures.account } }) },
  { name: 'ai_update_account', props: { account_id: 'a1', name: 'X' }, reply: () => ({ body: { account: fixtures.account } }) },
  { name: 'ai_list_account_stages', props: {}, reply: () => ({ body: { account_stages: [{ id: 's1' }] } }) },
  { name: 'ai_list_lists', props: {}, reply: () => ({ body: fixtures.lists }) },
  { name: 'ai_create_list', props: { name: 'L', modality: 'contacts' }, reply: () => ({ body: { label: fixtures.lists[0] } }) },
  { name: 'ai_update_list', props: { list_id: 'l1', name: 'L' }, reply: () => ({ body: { label: fixtures.lists[0] } }) },
  { name: 'ai_add_to_list', props: { list: 'Event leads', modality: 'contacts', record_ids: ['c1'] }, reply: (request) => ({ body: request.method === 'GET' ? fixtures.lists : { labels: [fixtures.lists[0]] } }) },
  { name: 'ai_remove_from_list', props: { list: 'Event leads', modality: 'contacts', record_ids: ['c1'] }, reply: (request) => ({ body: request.method === 'GET' ? fixtures.lists : { labels: [fixtures.lists[0]] } }) },
  { name: 'ai_search_sequences', props: {}, reply: () => ({ body: { emailer_campaigns: [{ id: 's1', name: 'Seq' }] } }) },
  { name: 'ai_list_email_accounts', props: {}, reply: () => ({ body: { email_accounts: [fixtures.emailAccount] } }) },
  { name: 'ai_add_contacts_to_sequence', props: { sequence_id: 's1', contact_ids: ['c1', 'c2'], email_account_id: 'e1', status: 'paused' }, reply: () => ({ body: { skipped_contact_ids: { c2: 'contacts_already_exists_in_current_campaign' } } }) },
  { name: 'ai_remove_contacts_from_sequence', props: { sequence_ids: ['s1'], contact_ids: ['c1'], mode: 'remove' }, reply: () => ({ body: {} }) },
  { name: 'ai_list_users', props: {}, reply: () => ({ body: { users: [{ id: 'u1', name: 'U' }] } }) },
  { name: 'ai_create_task', props: { contact_id: 'c1', user_id: 'u1', type: 'call', due_at: '2026-11-20T15:00:00Z' }, reply: () => ({ body: { task: fixtures.task } }) },
  { name: 'ai_search_tasks', props: {}, reply: () => ({ body: { tasks: [fixtures.task] } }) },
  { name: 'ai_get_task', props: { task_id: 't1' }, reply: () => ({ body: { task: fixtures.task } }) },
  { name: 'ai_list_deals', props: {}, reply: () => ({ body: { opportunities: [fixtures.deal] } }) },
  { name: 'ai_get_deal', props: { deal_id: 'd1' }, reply: () => ({ body: { opportunity: fixtures.deal } }) },
  { name: 'ai_create_deal', props: { name: 'D' }, reply: () => ({ body: { opportunity: fixtures.deal } }) },
  { name: 'ai_update_deal', props: { deal_id: 'd1', name: 'D' }, reply: () => ({ body: { opportunity: fixtures.deal } }) },
  { name: 'ai_list_deal_stages', props: {}, reply: () => ({ body: { opportunity_stages: [{ id: 'st1' }] } }) },
  { name: 'ai_list_custom_fields', props: {}, reply: () => ({ body: { fields: [{ id: 'f1' }] } }) },
  { name: 'ai_search_outreach_emails', props: {}, reply: () => ({ body: { emailer_messages: [{ id: 'm1' }] } }) },
  { name: 'ai_get_email_content', props: { email_ids: ['m1'] }, reply: () => ({ body: { emailer_messages: [{ id: 'm1' }] } }) },
  { name: 'ai_get_email_send_status', props: { email_id: 'm1' }, reply: () => ({ body: { id: 'm1', status: 'completed' } }) },
  { name: 'ai_search_calls', props: {}, reply: () => ({ body: { phone_calls: [{ id: 'p1' }] } }) },
  { name: 'create_contact', props: { email: 'a@b.c' }, reply: () => ({ body: { contact: fixtures.contact, labels: fixtures.lists } }) },
  { name: 'update_contact', props: { contact_id: 'c1', title: 'x' }, reply: () => ({ body: { contact: fixtures.contact, labels: [] } }) },
  { name: 'find_contact', props: { email: 'jane@example.com' }, reply: () => ({ body: { contacts: [fixtures.contact] } }) },
  { name: 'create_account', props: { name: 'X' }, reply: () => ({ body: { account: fixtures.account } }) },
  { name: 'update_account', props: { account_id: 'a1', name: 'X' }, reply: () => ({ body: { account: fixtures.account } }) },
  { name: 'create_deal', props: { name: 'D' }, reply: () => ({ body: { opportunity: fixtures.deal } }) },
  { name: 'create_task', props: { contact_id: 'c1', user_id: 'u1', type: 'call', due_at: '2026-11-20T15:00:00Z' }, reply: () => ({ body: { task: fixtures.task } }) },
  { name: 'add_contact_to_sequence', props: { sequence_id: 's1', contact_ids: ['c1'], email_account_id: 'e1', status: 'paused' }, reply: () => ({ body: { skipped_contact_ids: { c1: 'contacts_already_exists_in_current_campaign' } } }) },
];

describe('piece metadata', () => {
  test('floor is 0.88.2: ai atomics (0.86.4) and the Custom API Call property groups (0.88.2)', () => {
    expect(apollo.minimumSupportedRelease).toBe('0.88.2');
  });

  test('every action and every trigger has an outputSchema and aiMetadata', () => {
    for (const action of actions) {
      expect(action.outputSchema, action.name).toBeDefined();
      expect(action.aiMetadata?.description, action.name).toBeTruthy();
    }
    for (const trigger of triggers) {
      expect(trigger.outputSchema, trigger.name).toBeDefined();
      expect(trigger.aiMetadata?.description, trigger.name).toBeTruthy();
      expect(trigger.sampleData, trigger.name).toBeDefined();
    }
  });

  test('audiences: originals and Tier B are human, every ai_ action is ai', () => {
    for (const action of actions) {
      const expected = action.name.startsWith('ai_') ? 'ai' : 'human';
      expect(action.audience, action.name).toBe(expected);
    }
    expect(actions.map((a) => a.name)).toEqual(expect.arrayContaining([...ORIGINAL_ACTIONS, ...TIER_B_ACTIONS]));
    expect(actions.filter((a) => a.name.startsWith('ai_'))).toHaveLength(41);
  });

  test('ai atomics use no Checkbox or dynamic dropdown props and state their credit cost', () => {
    for (const action of actions.filter((a) => a.name.startsWith('ai_'))) {
      for (const [key, prop] of Object.entries(action.props)) {
        expect(['CHECKBOX', 'DROPDOWN', 'MULTI_SELECT_DROPDOWN'], `${action.name}.${key}`).not.toContain(prop.type);
      }
      expect(action.aiMetadata?.description ?? '', action.name).toMatch(/credit/);
    }
  });

  test('original props are all still present', () => {
    const expected: Record<string, string[]> = {
      matchPerson: ['email', 'cacheResponse'],
      enrichCompany: ['domain', 'cacheResponse'],
      peopleSearch: ['q_keywords', 'person_titles', 'person_locations', 'person_seniorities', 'organization_ids', 'organization_num_employees_ranges', 'q_organization_domains', 'organization_locations', 'cacheResponse'],
      organizationSearch: ['q_organization_name', 'organization_locations', 'organization_not_locations', 'organization_num_employees_ranges', 'organization_ids', 'q_organization_domains', 'organization_industry_tag_ids', 'cacheResponse'],
      newsArticlesSearch: ['organization_ids', 'categories', 'published_at_min', 'published_at_max', 'cacheResponse'],
      organizationJobPostings: ['organization_id', 'cacheResponse'],
    };
    for (const [name, props] of Object.entries(expected)) {
      expect(Object.keys(byName({ name }).props), name).toEqual(expect.arrayContaining(props));
    }
  });

  test('every tool named in prose is a registered display name', () => {
    const displayNames = new Set(actions.map((a) => a.displayName));
    const prose = actions.flatMap((action) => [action.aiMetadata?.description ?? '', action.description, ...Object.values(action.props).map((prop) => prop.description ?? '')]).join('\n');
    const referenced = [...prose.matchAll(/(?<!Records )from ((?:[A-Z][a-z]+ ?)+?)(?= \(field|,| or )/g)].map((match) => match[1].trim());
    const explicit = ['Enrich Person', 'Search Contacts', 'Search People', 'Search Organizations', 'Enrich Organization', 'List Organization Job Postings', 'Search News Articles', 'Find Contact by Email', 'Create Contact', 'Search Accounts', 'Create Account', 'List Lists', 'Add Records to List', 'Remove Records from List', 'Create List', 'Add Contacts to Sequence', 'Stop or Remove Contacts from Sequence', 'Get Credit Usage', 'Get Email Content', 'Match Person', 'List Deals', 'Search Outreach Emails'];
    for (const name of [...referenced, ...explicit]) {
      expect(displayNames.has(name), name).toBe(true);
    }
    expect(referenced.length).toBeGreaterThan(10);
  });
});

describe('output schemas match what run() returns (both directions)', () => {
  test.each(SCORED)('$name', async ({ name, props, reply }) => {
    stubFetch({ respond: reply });
    const action = byName({ name });
    const output: unknown = await action.run(runContext({ props }));
    const schema: OutputSchema | undefined = action.outputSchema;
    expect(schema).toBeDefined();
    expect(score({ fields: schema?.fields ?? [], value: output, path: '' })).toEqual([]);
  });

  test('every ai_ action and Tier B action is scored', () => {
    const scored = new Set(SCORED.map((entry) => entry.name));
    for (const action of actions.filter((a) => a.name.startsWith('ai_') || TIER_B_ACTIONS.includes(a.name))) {
      expect(scored.has(action.name), action.name).toBe(true);
    }
  });

  test('trigger items match their schema', async () => {
    stubFetch({ respond: () => ({ body: { contacts: [fixtures.contact], accounts: [fixtures.account] } }) });
    for (const trigger of triggers) {
      const items = await trigger.test(runContext({}));
      for (const item of items) {
        expect(score({ fields: trigger.outputSchema?.fields ?? [], value: item, path: '' }), trigger.name).toEqual([]);
      }
      expect(score({ fields: trigger.outputSchema?.fields ?? [], value: trigger.sampleData, path: '' }), `${trigger.name} sampleData`).toEqual([]);
    }
  });
});
