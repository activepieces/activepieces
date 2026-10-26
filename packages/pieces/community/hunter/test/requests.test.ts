import { afterEach, describe, expect, test, vi } from 'vitest';
import { hunterRequests } from '../src/lib/common/requests';
import { API_KEY, replies, stubFetch } from './helpers';

afterEach(() => vi.unstubAllGlobals());

const LEAD = { id: 7, email: 'a@example.com', first_name: 'A' };

describe('lead body', () => {
  test('omitted fields are not sent, cleared fields are sent as null', () => {
    const body = hunterRequests.buildLeadBody({ props: { first_name: ' Ann ', last_name: '', notes: undefined }, clearFields: ['notes', 'confidence_score'], requireEmail: false });
    expect(body).toEqual({ first_name: 'Ann', notes: null, confidence_score: null });
  });

  test('refuses a field that is both set and cleared', () => {
    expect(() => hunterRequests.buildLeadBody({ props: { notes: 'x' }, clearFields: ['notes'], requireEmail: false })).toThrow('both set and marked to clear');
  });

  test('merges list dropdown and list IDs, coercing numeric strings', () => {
    const body = hunterRequests.buildLeadBody({ props: { email: 'a@example.com', leads_list_id: 3, leads_list_ids: ['4', 3] }, clearFields: [], requireEmail: true });
    expect(body['leads_list_ids']).toEqual([3, 4]);
  });

  test('rejects bad list IDs, scores and attributes', () => {
    expect(() => hunterRequests.buildLeadBody({ props: { email: 'a@example.com', leads_list_ids: ['abc'] }, clearFields: [], requireEmail: true })).toThrow('positive whole number');
    expect(() => hunterRequests.buildLeadBody({ props: { email: 'a@example.com', confidence_score: 101 }, clearFields: [], requireEmail: true })).toThrow('between 0 and 100');
    expect(() => hunterRequests.buildLeadBody({ props: { email: 'a@example.com', custom_attributes: [1] }, clearFields: [], requireEmail: true })).toThrow('JSON object');
    expect(() => hunterRequests.buildLeadBody({ props: {}, clearFields: [], requireEmail: true })).toThrow('Email is required');
  });
});

describe('lead requests', () => {
  test('update sends PUT then re-reads the lead after the 204', async () => {
    const seen = stubFetch(replies([{ status: 204 }, { body: { data: LEAD } }]));
    const result = await hunterRequests.updateLead({ apiKey: API_KEY, leadId: '7', body: { notes: null } });
    expect(seen.map((r) => `${r.method} ${r.path}`)).toEqual(['PUT /v2/leads/7', 'GET /v2/leads/7']);
    expect(seen[0].body).toEqual({ notes: null });
    expect(result).toEqual({ success: true, lead: LEAD });
  });

  test('delete: 404 fails for humans and returns deleted=false for the AI twin', async () => {
    const notFound = { status: 404, body: { errors: [{ id: 'not_found', details: 'This lead does not exist.' }] } };
    stubFetch(replies([notFound]));
    await expect(hunterRequests.deleteLead({ apiKey: API_KEY, leadId: 7, missingOk: false })).rejects.toThrow('not found');
    stubFetch(replies([notFound]));
    await expect(hunterRequests.deleteLead({ apiKey: API_KEY, leadId: 7, missingOk: true })).resolves.toEqual({ success: true, deleted: false, lead_id: 7 });
  });

  test('upsert reports created from the status code', async () => {
    stubFetch(replies([{ status: 201, body: { data: LEAD } }]));
    await expect(hunterRequests.upsertLead({ apiKey: API_KEY, body: { email: 'a@example.com' } })).resolves.toEqual({ created: true, lead: LEAD });
    stubFetch(replies([{ status: 200, body: { data: LEAD } }]));
    await expect(hunterRequests.upsertLead({ apiKey: API_KEY, body: { email: 'a@example.com' } })).resolves.toEqual({ created: false, lead: LEAD });
  });
});

describe('campaign recipients', () => {
  test('coerces string lead IDs instead of dropping them', async () => {
    const seen = stubFetch(replies([{ body: { data: { recipients_added: 2, skipped_recipients: [] } } }]));
    await hunterRequests.addRecipients({ apiKey: API_KEY, campaignId: '9', emails: [' b@example.com '], leadIds: ['5', 6] });
    expect(seen[0].path).toBe('/v2/campaigns/9/recipients');
    expect(seen[0].body).toEqual({ emails: ['b@example.com'], lead_ids: [5, 6] });
  });

  test('validates before calling Hunter', async () => {
    const seen = stubFetch(replies([{ body: {} }]));
    await expect(hunterRequests.addRecipients({ apiKey: API_KEY, campaignId: '9', emails: [], leadIds: [] })).rejects.toThrow('at least one');
    await expect(hunterRequests.addRecipients({ apiKey: API_KEY, campaignId: '9', emails: ['nope'], leadIds: [] })).rejects.toThrow('not a valid email');
    await expect(hunterRequests.removeRecipients({ apiKey: API_KEY, campaignId: 'x', emails: ['a@example.com'] })).rejects.toThrow('Campaign ID');
    expect(seen).toHaveLength(0);
  });

  test('remove sends DELETE with the emails body', async () => {
    const seen = stubFetch(replies([{ status: 201, body: { data: { recipients_removed: ['a@example.com'], recipients_canceled: [], messages_canceled: 0, skipped_recipients: null } } }]));
    const result = await hunterRequests.removeRecipients({ apiKey: API_KEY, campaignId: 9, emails: ['a@example.com'] });
    expect(seen[0].method).toBe('DELETE');
    expect(seen[0].body).toEqual({ emails: ['a@example.com'] });
    expect(result).toEqual({ recipients_removed: ['a@example.com'], recipients_canceled: [], messages_canceled: 0, skipped_recipients: [] });
  });
});

describe('lookups', () => {
  test('verify polls 202 and fails 222', async () => {
    const seen = stubFetch(replies([{ status: 202, body: {} }, { body: { data: { status: 'valid' } } }]));
    const result = await hunterRequests.verifyEmail({ apiKey: API_KEY, email: 'a@example.com', wait: async () => undefined });
    expect(result).toEqual({ status: 'valid' });
    expect(seen).toHaveLength(2);
    stubFetch(replies([{ status: 222, body: { errors: [{ id: 'smtp_error', details: 'SMTP failed' }] } }]));
    await expect(hunterRequests.verifyEmail({ apiKey: API_KEY, email: 'a@example.com', wait: async () => undefined })).rejects.toThrow('SMTP failed');
  });

  test('verify gives up after the 60 s deadline', async () => {
    stubFetch(replies([{ status: 202, body: {} }]));
    let clock = 0;
    await expect(
      hunterRequests.verifyEmail({ apiKey: API_KEY, email: 'a@example.com', wait: async (ms) => { clock += ms; }, now: () => clock }),
    ).rejects.toThrow('still verifying');
  });

  test('enrichment 404 is a documented empty result', async () => {
    stubFetch(replies([{ status: 404, body: { errors: [{ id: 'not_found' }] } }]));
    await expect(hunterRequests.enrichCompany({ apiKey: API_KEY, domain: 'nope.example' })).resolves.toEqual({ found: false, company: null });
    stubFetch(replies([{ status: 404, body: { errors: [{ id: 'not_found' }] } }]));
    await expect(hunterRequests.enrichPersonAndCompany({ apiKey: API_KEY, email: 'a@nope.example' })).resolves.toEqual({ found: false, person: null, company: null });
  });

  test('search keeps Hunter meta: count = matching, total = account', async () => {
    stubFetch(replies([{ body: { data: { leads: [LEAD] }, meta: { count: 1, total: 40, params: { limit: 20, offset: 0 } } } }]));
    await expect(hunterRequests.searchLeads({ apiKey: API_KEY, query: {} })).resolves.toEqual({ leads: [LEAD], count: 1, total: 40, limit: 20, offset: 0 });
  });
});
