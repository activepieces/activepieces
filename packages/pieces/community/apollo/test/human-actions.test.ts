import { afterEach, describe, expect, test, vi } from 'vitest';
import { matchPerson } from '../src/lib/actions/match-person';
import { enrichCompany } from '../src/lib/actions/enrich-company';
import { peopleSearch } from '../src/lib/actions/people-search';
import { organizationSearch } from '../src/lib/actions/organization-search';
import { newsArticlesSearch } from '../src/lib/actions/news-articles-search';
import { organizationJobPostings } from '../src/lib/actions/organization-job-postings';
import { createContactAction } from '../src/lib/actions/create-contact';
import { updateContactAction } from '../src/lib/actions/update-contact';
import { findContactAction } from '../src/lib/actions/find-contact';
import { createAccountAction } from '../src/lib/actions/create-account';
import { createDealAction } from '../src/lib/actions/create-deal';
import { createTaskAction } from '../src/lib/actions/create-task';
import { addContactToSequenceAction } from '../src/lib/actions/add-contact-to-sequence';
import { fixtures } from './fixtures';
import { API_KEY, memoryStore, replies, runContext, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

describe('match person', () => {
  test('posts the email as a query param on /api/v1/people/match and caches a found person', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { person: fixtures.person } }] }) });
    const store = memoryStore();
    const output = await matchPerson.run(runContext({ props: { email: ' tim@apollo.io ', cacheResponse: true }, store }));
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe('/api/v1/people/match');
    expect(seen[0].query.get('email')).toBe('tim@apollo.io');
    expect(seen[0].headers.get('x-api-key')).toBe(API_KEY);
    expect(output).toEqual(fixtures.person);
    expect(store.data.get('_apollo_person_tim@apollo.io')).toEqual(fixtures.person);
    const again = await matchPerson.run(runContext({ props: { email: 'tim@apollo.io', cacheResponse: true }, store }));
    expect(again).toEqual(fixtures.person);
    expect(seen).toHaveLength(1);
  });

  test('a miss returns {} and is not cached; a cached {} from older versions is treated as a miss', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { person: null } }] }) });
    const store = memoryStore({ initial: { '_apollo_person_x@y.com': {} } });
    expect(await matchPerson.run(runContext({ props: { email: 'x@y.com', cacheResponse: true }, store }))).toEqual({});
    expect(seen).toHaveLength(1);
    expect(store.data.get('_apollo_person_x@y.com')).toEqual({});
    expect(store.puts).toBe(0);
  });
});

describe('enrich company', () => {
  test('encodes the domain on GET /organizations/enrich and does not cache a miss', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: {} }] }) });
    const store = memoryStore();
    expect(await enrichCompany.run(runContext({ props: { domain: 'a&b.com', cacheResponse: true }, store }))).toEqual({});
    expect(seen[0].method).toBe('GET');
    expect(seen[0].path).toBe('/api/v1/organizations/enrich');
    expect(seen[0].url).toContain('domain=a%26b.com');
    expect(store.puts).toBe(0);
  });
});

describe('search actions', () => {
  test('people search sends both domain params, paging, and fills pagination from total_entries', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: fixtures.peopleSearch }] }) });
    const output = await peopleSearch.run(runContext({ props: { person_titles: ['CEO'], q_organization_domains: ['apollo.io'], page: 2, per_page: 50, cacheResponse: false } }));
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe('/api/v1/mixed_people/api_search');
    expect(seen[0].query.getAll('person_titles[]')).toEqual(['CEO']);
    expect(seen[0].query.getAll('q_organization_domains[]')).toEqual(['apollo.io']);
    expect(seen[0].query.getAll('q_organization_domains_list[]')).toEqual(['apollo.io']);
    expect(seen[0].query.get('page')).toBe('2');
    expect(seen[0].query.get('per_page')).toBe('50');
    expect(output).toEqual({ people: fixtures.peopleSearch.people, pagination: { page: 2, per_page: 50, total_entries: 232764882 }, total_entries: 232764882 });
  });

  test('organization search returns the raw body and validates per_page', async () => {
    const body = { organizations: [fixtures.organization], accounts: [], pagination: { page: 1, per_page: 10, total_entries: 1, total_pages: 1 } };
    const seen = stubFetch({ respond: replies({ list: [{ body }] }) });
    expect(await organizationSearch.run(runContext({ props: { q_organization_name: 'Apollo', cacheResponse: false } }))).toEqual(body);
    expect(seen[0].path).toBe('/api/v1/mixed_companies/search');
    expect(seen[0].query.get('q_organization_name')).toBe('Apollo');
    await expect(organizationSearch.run(runContext({ props: { per_page: 500 } }))).rejects.toThrow('between 1 and 100');
  });

  test('news search keeps the old output shape', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { news_articles: [{ id: 'n1' }], pagination: { page: 1 } } }] }) });
    expect(await newsArticlesSearch.run(runContext({ props: { organization_ids: ['o1', 'o2'], categories: ['hires'], published_at_min: '2026-01-01' } }))).toEqual({ news_articles: [{ id: 'n1' }], pagination: { page: 1 } });
    expect(seen[0].query.getAll('organization_ids[]')).toEqual(['o1', 'o2']);
    expect(seen[0].query.get('published_at[min]')).toBe('2026-01-01');
  });

  test('job postings encodes the organization id and still returns a bare array', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { organization_job_postings: [{ id: 'j1', title: 'AE' }] } }] }) });
    expect(await organizationJobPostings.run(runContext({ props: { organization_id: 'a/b', page: 3 } }))).toEqual([{ id: 'j1', title: 'AE' }]);
    expect(seen[0].path).toBe('/api/v1/organizations/a%2Fb/job_postings');
    expect(seen[0].query.get('page')).toBe('3');
  });
});

describe('CRM human actions', () => {
  test('create contact sends only filled fields and run_dedupe when checked', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { contact: fixtures.contact, labels: fixtures.lists.slice(0, 1) } }] }) });
    const output = await createContactAction.run(runContext({ props: { first_name: 'Jane', email: 'jane@example.com', label_names: ['Event leads'], run_dedupe: true, title: '' } }));
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe('/api/v1/contacts');
    expect(seen[0].body).toEqual({ first_name: 'Jane', email: 'jane@example.com', label_names: ['Event leads'], run_dedupe: true });
    expect(output.contact['id']).toBe(fixtures.contact.id);
    expect(output.labels[0]['name']).toBe('Event leads');
  });

  test('create contact refuses an empty contact', async () => {
    await expect(createContactAction.run(runContext({ props: { title: 'CEO' } }))).rejects.toThrow('at least a first name');
  });

  test('update contact PATCHes only the given fields and refuses an empty update', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { contact: fixtures.contact } }] }) });
    await updateContactAction.run(runContext({ props: { contact_id: 'c1', title: 'VP Sales' } }));
    expect(seen[0].method).toBe('PATCH');
    expect(seen[0].path).toBe('/api/v1/contacts/c1');
    expect(seen[0].body).toEqual({ title: 'VP Sales' });
    await expect(updateContactAction.run(runContext({ props: { contact_id: 'c1' } }))).rejects.toThrow('at least one field');
  });

  test('find contact matches the email exactly and case-insensitively', async () => {
    const other = { ...fixtures.contact, id: 'other', email: 'jane@example.com.au', contact_emails: [] };
    const seen = stubFetch({ respond: replies({ list: [{ body: { contacts: [other, fixtures.contact] } }] }) });
    const output = await findContactAction.run(runContext({ props: { email: 'JANE@example.com' } }));
    expect(seen[0].path).toBe('/api/v1/contacts/search');
    expect(seen[0].body).toEqual({ q_keywords: 'JANE@example.com', page: 1, per_page: 100 });
    expect(output.found).toBe(true);
    expect(output.contact?.['id']).toBe(fixtures.contact.id);
    stubFetch({ respond: replies({ list: [{ body: { contacts: [other] } }] }) });
    expect(await findContactAction.run(runContext({ props: { email: 'jane@example.com' } }))).toEqual({ found: false, contact: null, other_contact_ids: [] });
  });

  test('create account needs a name or domain', async () => {
    await expect(createAccountAction.run(runContext({ props: { phone: '1' } }))).rejects.toThrow('name or a domain');
    const seen = stubFetch({ respond: replies({ list: [{ body: { account: fixtures.account } }] }) });
    await createAccountAction.run(runContext({ props: { domain: 'example.com' } }));
    expect(seen[0].body).toEqual({ domain: 'example.com' });
  });

  test('create deal formats the close date and validates the amount', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { opportunity: fixtures.deal } }] }) });
    const output = await createDealAction.run(runContext({ props: { name: 'Renewal', amount: '15000.50', closed_date: '2026-12-31T00:00:00.000Z' } }));
    expect(seen[0].path).toBe('/api/v1/opportunities');
    expect(seen[0].body).toEqual({ name: 'Renewal', amount: '15000.50', closed_date: '2026-12-31' });
    expect(output.deal['currency']).toBe('USD');
    expect(output.deal['created_at']).toBe(fixtures.deal.opportunity_created_at);
    await expect(createDealAction.run(runContext({ props: { name: 'x', amount: '$1,000' } }))).rejects.toThrow('plain number');
  });

  test('create task sends a scheduled task with an ISO due date', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { task: fixtures.task } }] }) });
    await createTaskAction.run(runContext({ props: { contact_id: 'c1', user_id: 'u1', type: 'call', due_at: '2026-11-20T15:00:00Z' } }));
    expect(seen[0].body).toEqual({ contact_id: 'c1', user_id: 'u1', type: 'call', status: 'scheduled', due_at: '2026-11-20T15:00:00.000Z' });
  });

  test('add contact to sequence sends query params and reports skips', async () => {
    const seen = stubFetch({ respond: replies({ list: [{ body: { contacts: [], skipped_contact_ids: { c2: 'contacts_already_exists_in_current_campaign' } } }] }) });
    const output = await addContactToSequenceAction.run(runContext({ props: { sequence_id: 's1', email_account_id: 'e1', contact_ids: ['c1', 'c2'], status: 'paused' } }));
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe('/api/v1/emailer_campaigns/s1/add_contact_ids');
    expect(seen[0].query.get('emailer_campaign_id')).toBe('s1');
    expect(seen[0].query.getAll('contact_ids[]')).toEqual(['c1', 'c2']);
    expect(seen[0].query.get('send_email_from_email_account_id')).toBe('e1');
    expect(seen[0].query.get('status')).toBe('paused');
    expect(output).toEqual({ sequence_id: 's1', status: 'paused', added_contact_ids: ['c1'], skipped: [{ contact_id: 'c2', reason: 'contacts_already_exists_in_current_campaign', already_in_sequence: true }] });
  });

  test('add contact to sequence fails when nothing was added for a blocking reason', async () => {
    stubFetch({ respond: replies({ list: [{ body: { contacts: [], skipped_contact_ids: { c1: 'contact_has_no_email', c2: 'contacts_already_exists_in_current_campaign' } } }] }) });
    await expect(addContactToSequenceAction.run(runContext({ props: { sequence_id: 's1', email_account_id: 'e1', contact_ids: ['c1', 'c2'], status: 'paused' } }))).rejects.toThrow('added none of the contacts to the sequence: c1: contact_has_no_email');
  });

  test('add contact to sequence passes when every contact is already in the sequence', async () => {
    stubFetch({ respond: replies({ list: [{ body: { contacts: [], skipped_contact_ids: { c1: 'contacts_already_exists_in_current_campaign' } } }] }) });
    const output = await addContactToSequenceAction.run(runContext({ props: { sequence_id: 's1', email_account_id: 'e1', contact_ids: ['c1'], status: 'paused' } }));
    expect(output).toEqual({ sequence_id: 's1', status: 'paused', added_contact_ids: [], skipped: [{ contact_id: 'c1', reason: 'contacts_already_exists_in_current_campaign', already_in_sequence: true }] });
  });

  test('a repeat add (Apollo says contacts_active_in_other_campaigns) passes when the contact is already in this sequence', async () => {
    const seen = stubFetch({
      respond: (request) =>
        request.method === 'GET'
          ? { body: { contact: { ...fixtures.contact, id: 'c1', emailer_campaign_ids: ['s1'] } } }
          : { body: { contacts: [], skipped_contact_ids: { c1: 'contacts_active_in_other_campaigns' } } },
    });
    const output = await addContactToSequenceAction.run(runContext({ props: { sequence_id: 's1', email_account_id: 'e1', contact_ids: ['c1'], status: 'paused' } }));
    expect(seen.map((request) => `${request.method} ${request.path}`)).toEqual(['POST /api/v1/emailer_campaigns/s1/add_contact_ids', 'GET /api/v1/contacts/c1']);
    expect(output.skipped).toEqual([{ contact_id: 'c1', reason: 'contacts_active_in_other_campaigns', already_in_sequence: true }]);
  });

  test('membership is also read from contact_campaign_statuses', async () => {
    stubFetch({
      respond: (request) =>
        request.method === 'GET'
          ? { body: { contact: { ...fixtures.contact, id: 'c1', emailer_campaign_ids: [], contact_campaign_statuses: [{ emailer_campaign_id: 's1', status: 'paused' }] } } }
          : { body: { contacts: [], skipped_contact_ids: { c1: 'contacts_active_in_other_campaigns' } } },
    });
    const output = await addContactToSequenceAction.run(runContext({ props: { sequence_id: 's1', email_account_id: 'e1', contact_ids: ['c1'], status: 'paused' } }));
    expect(output.skipped[0].already_in_sequence).toBe(true);
  });

  test('a contact active in a truly different sequence still fails the step', async () => {
    stubFetch({
      respond: (request) =>
        request.method === 'GET'
          ? { body: { contact: { ...fixtures.contact, id: 'c1', emailer_campaign_ids: ['other-seq'] } } }
          : { body: { contacts: [], skipped_contact_ids: { c1: 'contacts_active_in_other_campaigns' } } },
    });
    await expect(addContactToSequenceAction.run(runContext({ props: { sequence_id: 's1', email_account_id: 'e1', contact_ids: ['c1'], status: 'paused' } }))).rejects.toThrow('c1: contacts_active_in_other_campaigns');
  });

  test('a failed membership lookup leaves the skip blocking with already_in_sequence null', async () => {
    stubFetch({
      respond: (request) =>
        request.method === 'GET' ? { status: 422, body: { error: 'This contact has been deleted.' } } : { body: { contacts: [], skipped_contact_ids: { c1: 'contacts_active_in_other_campaigns' } } },
    });
    await expect(addContactToSequenceAction.run(runContext({ props: { sequence_id: 's1', email_account_id: 'e1', contact_ids: ['c1'], status: 'paused' } }))).rejects.toThrow('added none');
  });

  test('membership lookups are capped at 10 contacts', async () => {
    const ids = Array.from({ length: 12 }, (_, index) => `c${index}`);
    const seen = stubFetch({
      respond: (request) =>
        request.method === 'GET'
          ? { body: { contact: { ...fixtures.contact, emailer_campaign_ids: ['s1'] } } }
          : { body: { contacts: [], skipped_contact_ids: Object.fromEntries(ids.map((id) => [id, 'contacts_active_in_other_campaigns'])) } },
    });
    await expect(addContactToSequenceAction.run(runContext({ props: { sequence_id: 's1', email_account_id: 'e1', contact_ids: ids, status: 'paused' } }))).rejects.toThrow('c10: contacts_active_in_other_campaigns; c11: contacts_active_in_other_campaigns');
    expect(seen.filter((request) => request.method === 'GET')).toHaveLength(10);
  });
});
