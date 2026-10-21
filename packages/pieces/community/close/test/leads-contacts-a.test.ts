import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createContactAi } from '../src/lib/actions/ai/create-contact-ai';
import { createLeadAi } from '../src/lib/actions/ai/create-lead-ai';
import { deleteContact } from '../src/lib/actions/ai/delete-contact';
import { deleteLead } from '../src/lib/actions/ai/delete-lead';
import { getContact } from '../src/lib/actions/ai/get-contact';
import { getLead } from '../src/lib/actions/ai/get-lead';
import { mergeLeads } from '../src/lib/actions/ai/merge-leads';
import { searchContacts } from '../src/lib/actions/ai/search-contacts';
import { searchLeads } from '../src/lib/actions/ai/search-leads';
import { updateContact } from '../src/lib/actions/ai/update-contact';
import { updateLead } from '../src/lib/actions/ai/update-lead';

const auth = { secret_text: 'api_key' };
const BASE = 'https://api.close.com/api/v1';

function run({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }) {
  return Reflect.apply(Reflect.get(action, 'run'), undefined, [{ auth, propsValue }]);
}

function mock(...bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of bodies) spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
  return spy;
}

afterEach(() => vi.restoreAllMocks());

const all = [createLeadAi, getLead, updateLead, deleteLead, searchLeads, mergeLeads, createContactAi, getContact, updateContact, deleteContact, searchContacts];

describe('metadata', () => {
  it.each(all)('$name is ai with schema', (a) => {
    expect(a.audience).toBe('ai');
    expect(a.outputSchema).toBeDefined();
    expect(a.aiMetadata?.description).toBeTruthy();
  });
  it('uses the planned names', () => {
    expect(all.map((a) => a.name)).toEqual(['create_lead_ai', 'get_lead', 'update_lead', 'delete_lead', 'search_leads', 'merge_leads', 'create_contact_ai', 'get_contact', 'update_contact', 'delete_contact', 'search_contacts']);
  });
});

describe('leads', () => {
  it('creates a lead with a nested contact and custom fields', async () => {
    const spy = mock({ id: 'lead_1', display_name: 'Acme', status_label: 'Potential' });
    const out = await run({ action: createLeadAi, propsValue: { name: ' Acme ', statusId: 'stat_1', contactName: 'Jo', contactEmail: 'jo@acme.com', customFields: { cf_a: 'x' } } });
    const req = spy.mock.calls[0][0];
    expect(req.method).toBe(HttpMethod.POST);
    expect(req.url).toBe(`${BASE}/lead/`);
    expect(req.body).toEqual({ name: 'Acme', status_id: 'stat_1', contacts: [{ name: 'Jo', emails: [{ email: 'jo@acme.com', type: 'office' }] }], 'custom.cf_a': 'x' });
    expect(out).toMatchObject({ id: 'lead_1', name: 'Acme', appUrl: 'https://app.close.com/lead/lead_1/' });
  });
  it('creates a lead without contacts', async () => {
    const spy = mock({ id: 'lead_1' });
    await run({ action: createLeadAi, propsValue: { name: 'Acme' } });
    expect(spy.mock.calls[0][0].body).toEqual({ name: 'Acme' });
  });
  it('rejects a bad status id', async () => {
    await expect(run({ action: createLeadAi, propsValue: { name: 'A', statusId: 'lead_1' } })).rejects.toThrow('stat_');
  });
  it('gets a lead', async () => {
    const spy = mock({ id: 'lead_1', name: 'Acme', contacts: [{ id: 'cont_1', emails: [{ email: 'a@b.c' }] }] });
    const out = await run({ action: getLead, propsValue: { leadId: 'lead_1' } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/lead/lead_1/`);
    expect(out.contacts[0]).toMatchObject({ id: 'cont_1', primaryEmail: 'a@b.c' });
  });
  it('rejects a path-traversal lead id', async () => {
    await expect(run({ action: getLead, propsValue: { leadId: '../me' } })).rejects.toThrow('Close ID');
  });
  it('updates only given lead fields', async () => {
    const spy = mock({ id: 'lead_1' });
    await run({ action: updateLead, propsValue: { leadId: 'lead_1', statusId: 'stat_2', customFields: { 'custom.cf_b': null } } });
    const req = spy.mock.calls[0][0];
    expect(req.method).toBe(HttpMethod.PUT);
    expect(req.url).toBe(`${BASE}/lead/lead_1/`);
    expect(req.body).toEqual({ status_id: 'stat_2', 'custom.cf_b': null });
  });
  it('refuses an empty lead update', async () => {
    await expect(run({ action: updateLead, propsValue: { leadId: 'lead_1' } })).rejects.toThrow('at least one');
  });
  it('deletes a lead', async () => {
    const spy = mock({});
    const out = await run({ action: deleteLead, propsValue: { leadId: 'lead_1' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.DELETE, url: `${BASE}/lead/lead_1/` });
    expect(out).toEqual({ deleted: true, id: 'lead_1' });
  });
  it('merges leads and returns the destination', async () => {
    const spy = mock({}, { id: 'lead_d', name: 'Kept' });
    const out = await run({ action: mergeLeads, propsValue: { sourceLeadId: 'lead_s', destinationLeadId: 'lead_d' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.POST, url: `${BASE}/lead/merge/`, body: { source: 'lead_s', destination: 'lead_d' } });
    expect(spy.mock.calls[1][0].url).toBe(`${BASE}/lead/lead_d/`);
    expect(out).toMatchObject({ mergedSourceId: 'lead_s', id: 'lead_d', name: 'Kept' });
  });
  it('refuses merging a lead into itself', async () => {
    await expect(run({ action: mergeLeads, propsValue: { sourceLeadId: 'lead_1', destinationLeadId: 'lead_1' } })).rejects.toThrow('different');
  });
  it('searches leads by text and status', async () => {
    const spy = mock({ data: [{ id: 'lead_1', display_name: 'Acme' }], cursor: 'c2' });
    const out = await run({ action: searchLeads, propsValue: { text: 'acme', exactPhrase: true, statusId: 'stat_1', limit: 10 } });
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe(`${BASE}/data/search/`);
    expect(req.body).toMatchObject({
      _limit: 10,
      query: { type: 'and', queries: [
        { type: 'object_type', object_type: 'lead' },
        { type: 'text', value: 'acme', mode: 'phrase' },
        { type: 'field_condition', condition: { type: 'reference', object_ids: ['stat_1'] } },
      ] },
    });
    expect(out).toMatchObject({ count: 1, hasMore: true, nextCursor: 'c2', items: [{ id: 'lead_1', name: 'Acme' }] });
  });
  it('passes the cursor and defaults limit', async () => {
    const spy = mock({ data: [], cursor: null });
    const out = await run({ action: searchLeads, propsValue: { cursor: 'c2' } });
    expect(spy.mock.calls[0][0].body).toMatchObject({ _limit: 25, cursor: 'c2' });
    expect(out).toMatchObject({ count: 0, hasMore: false, nextCursor: null });
  });
  it('rejects an out-of-range limit', async () => {
    await expect(run({ action: searchLeads, propsValue: { limit: 500 } })).rejects.toThrow('1 to 100');
  });
});

describe('contacts', () => {
  it('creates a contact on a lead', async () => {
    const spy = mock({ id: 'cont_1', lead_id: 'lead_1', name: 'Jo' });
    const out = await run({ action: createContactAi, propsValue: { leadId: 'lead_1', name: 'Jo', email: 'jo@a.com', phone: '+15550100' } });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.POST,
      url: `${BASE}/contact/`,
      body: { name: 'Jo', lead_id: 'lead_1', emails: [{ email: 'jo@a.com', type: 'office' }], phones: [{ phone: '+15550100', type: 'office' }] },
    });
    expect(out).toMatchObject({ id: 'cont_1', leadId: 'lead_1' });
  });
  it('requires a name', async () => {
    await expect(run({ action: createContactAi, propsValue: { name: ' ' } })).rejects.toThrow('Name is required');
  });
  it('gets a contact', async () => {
    const spy = mock({ id: 'cont_1', phones: [{ phone: '+1', phone_formatted: '+1', type: 'mobile' }], 'custom.cf_x': 'v' });
    const out = await run({ action: getContact, propsValue: { contactId: 'cont_1' } });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE}/contact/cont_1/`);
    expect(out).toMatchObject({ primaryPhone: '+1', custom: { cf_x: 'v' } });
  });
  it('updates a contact replacing emails', async () => {
    const spy = mock({ id: 'cont_1' });
    await run({ action: updateContact, propsValue: { contactId: 'cont_1', title: 'CEO', email: 'new@a.com' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.PUT, url: `${BASE}/contact/cont_1/`, body: { title: 'CEO', emails: [{ email: 'new@a.com', type: 'office' }] } });
  });
  it('refuses an empty contact update', async () => {
    await expect(run({ action: updateContact, propsValue: { contactId: 'cont_1' } })).rejects.toThrow('at least one');
  });
  it('deletes a contact', async () => {
    const spy = mock({});
    const out = await run({ action: deleteContact, propsValue: { contactId: 'cont_1' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.DELETE, url: `${BASE}/contact/cont_1/` });
    expect(out).toEqual({ deleted: true, id: 'cont_1' });
  });
  it('rejects a lead id as contact id', async () => {
    await expect(run({ action: deleteContact, propsValue: { contactId: 'lead_1' } })).rejects.toThrow('cont_');
  });
  it('searches contacts within a lead', async () => {
    const spy = mock({ data: [{ id: 'cont_1', name: 'Jo' }] });
    const out = await run({ action: searchContacts, propsValue: { text: 'jo', leadId: 'lead_1' } });
    expect(spy.mock.calls[0][0].body).toMatchObject({
      _fields: { contact: expect.arrayContaining(['id', 'emails']) },
      query: { queries: [
        { object_type: 'contact' },
        { type: 'text', value: 'jo', mode: 'full_words' },
        { condition: { type: 'reference', reference_type: 'lead', object_ids: ['lead_1'] } },
      ] },
    });
    expect(out).toMatchObject({ count: 1, hasMore: false, items: [{ id: 'cont_1', name: 'Jo' }] });
  });
});
