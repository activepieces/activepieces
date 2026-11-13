import { beforeEach, describe, expect, it, vi } from 'vitest';
import { zohoAiActions } from '../src/lib/actions/ai';
import { listRecordsAtomic, updateRecordAtomic, upsertRecordAtomic } from '../src/lib/actions/ai/records';
import { mergeDraft, updateEmailDraftAtomic } from '../src/lib/actions/ai/drafts';
import { addTagsAtomic, createTagAtomic, updateNoteAtomic } from '../src/lib/actions/ai/notes-tags';
import { downloadAttachmentAtomic, listRelatedRecordsAtomic, linkRelatedRecordAtomic } from '../src/lib/actions/ai/related-attachments';
import { fileNameFromDisposition } from '../src/lib/common/download';
import { getRecordAtomic } from '../src/lib/actions/ai/records';
import { convertLeadAtomic, createEventAtomic, createLeadAtomic } from '../src/lib/actions/ai/typed';
import { zohoCrm } from '../src/index';
import { AUTH_EU, call, httpError, ok, runAction, sendRequest } from './helpers';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  const { mockHttpClient } = await import('./helpers');
  return { ...actual, ...mockHttpClient() };
});

const LIST = { fields: undefined, per_page: undefined, page: undefined, page_token: undefined, sort_by: undefined, sort_order: undefined, custom_view_id: undefined };
const WRITE = { skip_automation: false };
const LEAD = {
  first_name: undefined, company: undefined, email: undefined, phone: undefined, mobile: undefined, title: undefined, website: undefined,
  lead_source: undefined, lead_status: undefined, description: undefined, owner_id: undefined, additional_fields: undefined,
};
const EVENT = { all_day: false, venue: undefined, description: undefined, related_module: undefined, related_record_id: undefined, owner_id: undefined, additional_fields: undefined };
const CONVERT = {
  account_id: undefined, contact_id: undefined, assign_to: undefined, overwrite: false, notify_lead_owner: false, notify_new_entity_owner: false,
  deal_name: undefined, deal_stage: undefined, deal_closing_date: undefined, deal_amount: undefined, deal_pipeline: undefined,
};
const RELATED = {
  module_api_name: 'Accounts', record_id: '1', related_list_api_name: 'Contacts', fields: undefined, page: undefined, per_page: undefined, page_token: undefined,
};
const DRAFT = { from: undefined, to: undefined, cc: undefined, bcc: undefined, subject: undefined, content: undefined, rich_text: undefined, reply_to: undefined };

beforeEach(() => sendRequest.mockReset());

describe('agent surface metadata', () => {
  it('ships 34 ai atomics with metadata, and demotes the PR A twins', () => {
    expect(zohoAiActions).toHaveLength(34);
    for (const a of zohoAiActions) {
      expect(a.audience).toBe('ai');
      expect(a.name.startsWith('zoho_crm_')).toBe(true);
      expect(a.aiMetadata?.description?.length).toBeGreaterThan(40);
      expect(typeof a.aiMetadata?.idempotent).toBe('boolean');
      expect(a.classification).toBeDefined();
    }
    const trues = zohoAiActions.filter((a) => a.aiMetadata?.idempotent === true).length;
    expect(trues).toBe(21);
    const actions = zohoCrm.actions();
    expect(Object.keys(actions)).toHaveLength(45);
    for (const name of ['create_record', 'update_record', 'get_record', 'upsert_record', 'delete_record', 'convert_lead', 'add_note', 'add_tags_to_record', 'upload_attachment']) {
      expect(actions[name].audience).toBe('human');
    }
    expect(actions['read-file'].audience).toBe('both');
  });
});

describe('list_records', () => {
  it('fills fields from metadata when omitted and sends documented params', async () => {
    ok({ body: { fields: [{ api_name: 'id' }, { api_name: 'Last_Name' }, { api_name: 'Custom__c' }, { api_name: 'Hidden', visible: false }] } });
    ok({ body: { data: [{ id: '1', Custom__c: 'v' }], info: { more_records: true, next_page_token: 'tkn', page: 1 } } });
    const out = await runAction({ action: listRecordsAtomic, auth: AUTH_EU, propsValue: { ...LIST, module_api_name: 'Leads', per_page: 2, sort_by: 'Created_Time' } });
    expect(call(1).url).toBe('https://www.zohoapis.eu/crm/v8/Leads');
    expect(call(1).queryParams).toEqual({ fields: 'id,Last_Name,Custom__c', per_page: '2', sort_by: 'Created_Time' });
    expect(out).toMatchObject({ count: 1, more_records: true, next_page_token: 'tkn' });
  });

  it('handles 204 as an empty page', async () => {
    ok({ body: undefined, status: 204 });
    const out = await runAction({ action: listRecordsAtomic, auth: AUTH_EU, propsValue: { ...LIST, module_api_name: 'Leads', fields: ['id'] } });
    expect(out).toMatchObject({ records: [], count: 0, more_records: false });
  });

  it('rejects page with page_token, pages past 2,000, and >50 fields before any request', async () => {
    await expect(runAction({ action: listRecordsAtomic, auth: AUTH_EU, propsValue: { ...LIST, module_api_name: 'Leads', page: 2, page_token: 'x', fields: ['id'] } })).rejects.toThrow(/either page or page_token/);
    await expect(runAction({ action: listRecordsAtomic, auth: AUTH_EU, propsValue: { ...LIST, module_api_name: 'Leads', page: 11, per_page: 200, fields: ['id'] } })).rejects.toThrow(/2,000/);
    await expect(runAction({ action: listRecordsAtomic, auth: AUTH_EU, propsValue: { ...LIST, module_api_name: 'Leads', fields: Array.from({ length: 51 }, (_, i) => `F${i}`) } })).rejects.toThrow(/50 fields/);
    await expect(runAction({ action: listRecordsAtomic, auth: AUTH_EU, propsValue: { ...LIST, module_api_name: 'Leads/../x', fields: ['id'] } })).rejects.toThrow(/API name/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('record writes', () => {
  it('update sends exactly the given keys and refuses id in data', async () => {
    ok({ body: { data: [{ status: 'success', code: 'SUCCESS', details: { id: '5725767000000524157' } }] } });
    await runAction({ action: updateRecordAtomic, auth: AUTH_EU, propsValue: { ...WRITE, module_api_name: 'Deals', record_id: '5725767000000524157', data: { Stage: 'Closed Won' }, append_multiselect_fields: undefined } });
    expect(call(0)).toMatchObject({ method: 'PUT', url: 'https://www.zohoapis.eu/crm/v8/Deals/5725767000000524157', body: { data: [{ Stage: 'Closed Won' }] } });
    await expect(runAction({ action: updateRecordAtomic, auth: AUTH_EU, propsValue: { ...WRITE, module_api_name: 'Deals', record_id: '1', data: { id: '2' }, append_multiselect_fields: undefined } })).rejects.toThrow(/record_id/);
  });

  it('upsert sends duplicate_check_fields and surfaces action', async () => {
    ok({ body: { data: [{ status: 'success', action: 'update', duplicate_field: 'Email', details: { id: '7' } }] } });
    const out = await runAction({ action: upsertRecordAtomic, auth: AUTH_EU, propsValue: { ...WRITE, module_api_name: 'Leads', data: { Last_Name: 'D', Email: 'd@x.com' }, duplicate_check_fields: ['Email'] } });
    expect(call(0).url).toBe('https://www.zohoapis.eu/crm/v8/Leads/upsert');
    expect(call(0).body).toEqual({ data: [{ Last_Name: 'D', Email: 'd@x.com' }], duplicate_check_fields: ['Email'] });
    expect(out).toMatchObject({ id: '7', action: 'update', duplicate_field: 'Email' });
  });

  it('create_lead: typed props win over additional_fields', async () => {
    ok({ body: { data: [{ status: 'success', details: { id: '1' } }] }, status: 201 });
    await runAction({ action: createLeadAtomic, auth: AUTH_EU, propsValue: { ...LEAD, last_name: 'Doe', email: 'a@x.com', additional_fields: { Email: 'b@x.com', Custom__c: 1 }, owner_id: '42' } });
    expect(call(0).body.data[0]).toEqual({ Email: 'a@x.com', Custom__c: 1, Last_Name: 'Doe', Owner: { id: '42' } });
  });

  it('create_event validates the related pair and the time order', async () => {
    await expect(runAction({ action: createEventAtomic, auth: AUTH_EU, propsValue: { ...EVENT, event_title: 'x', start_datetime: '2026-10-01T09:00:00+02:00', end_datetime: '2026-10-01T10:00:00+02:00', related_module: 'Deals' } })).rejects.toThrow(/together/);
    await expect(runAction({ action: createEventAtomic, auth: AUTH_EU, propsValue: { ...EVENT, event_title: 'x', start_datetime: '2026-10-01T09:00:00+02:00', end_datetime: '2026-10-01T08:00:00+02:00' } })).rejects.toThrow(/not be before/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('convert_lead requires stage + closing date with a deal', async () => {
    await expect(runAction({ action: convertLeadAtomic, auth: AUTH_EU, propsValue: { ...CONVERT, lead_id: '1', deal_name: 'D' } })).rejects.toThrow(/deal_stage/);
    ok({ body: { data: [{ status: 'success', details: { Contacts: { id: '2', name: 'C' }, Accounts: { id: '3', name: 'A' }, Deals: { id: '4', name: 'D' } } }] } });
    const out = await runAction({ action: convertLeadAtomic, auth: AUTH_EU, propsValue: { ...CONVERT, lead_id: '1', deal_name: 'D', deal_stage: 'Qualification', deal_closing_date: '2026-12-31' } });
    expect(call(0).body).toEqual({ data: [{ Deals: { Deal_Name: 'D', Stage: 'Qualification', Closing_Date: '2026-12-31' } }] });
    expect(out).toMatchObject({ contact_id: '2', account_id: '3', deal_id: '4' });
  });
});

describe('notes, tags, related', () => {
  it('update_note refuses an empty update and sends only the changed key', async () => {
    await expect(runAction({ action: updateNoteAtomic, auth: AUTH_EU, propsValue: { note_id: '1', title: undefined, content: undefined } })).rejects.toThrow(/title or content/);
    ok({ body: { data: [{ status: 'success', details: { id: '1' } }] } });
    await runAction({ action: updateNoteAtomic, auth: AUTH_EU, propsValue: { note_id: '1', title: undefined, content: 'new' } });
    expect(call(0).body).toEqual({ data: [{ Note_Content: 'new' }] });
  });

  it('create_tag returns the existing tag without creating', async () => {
    ok({ body: { tags: [{ id: '10', name: 'VIP', color_code: '#F17574' }] } });
    const out = await runAction({ action: createTagAtomic, auth: AUTH_EU, propsValue: { module_api_name: 'Leads', name: 'vip', color_code: undefined } });
    expect(out).toEqual({ id: '10', name: 'VIP', color_code: '#F17574', module: 'Leads', created: false });
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('create_tag creates when missing and validates color', async () => {
    await expect(runAction({ action: createTagAtomic, auth: AUTH_EU, propsValue: { module_api_name: 'Leads', name: 'x', color_code: '#000000' } })).rejects.toThrow(/color_code/);
    ok({ body: { tags: [] } });
    ok({ body: { tags: [{ code: 'SUCCESS', status: 'success', details: { id: '11' } }] } });
    const out = await runAction({ action: createTagAtomic, auth: AUTH_EU, propsValue: { module_api_name: 'Leads', name: 'New', color_code: undefined } });
    expect(call(1).body).toEqual({ tags: [{ name: 'New' }] });
    expect(out).toMatchObject({ id: '11', created: true });
  });

  it('add_tags keeps existing tags (over_write false) and caps ids', async () => {
    ok({ body: { data: [{ status: 'success', details: { id: '1', tags: [{ name: 'A' }, { name: 'B' }] } }] } });
    const out = await runAction({ action: addTagsAtomic, auth: AUTH_EU, propsValue: { module_api_name: 'Leads', record_ids: ['1'], tags: ['B'] } });
    expect(call(0).body).toEqual({ tags: [{ name: 'B' }], ids: ['1'], over_write: false });
    expect(out).toMatchObject({ success_count: 1, failed_count: 0 });
    await expect(runAction({ action: addTagsAtomic, auth: AUTH_EU, propsValue: { module_api_name: 'Leads', record_ids: Array.from({ length: 501 }, (_, i) => String(i + 1)), tags: ['B'] } })).rejects.toThrow(/500/);
  });

  it('link_related_record uses the documented batch body', async () => {
    ok({ body: { data: [{ status: 'success', code: 'SUCCESS', details: { id: '9' } }] } });
    await runAction({ action: linkRelatedRecordAtomic, auth: AUTH_EU, propsValue: { module_api_name: 'Campaigns', record_id: '1', related_list_api_name: 'Contacts', related_record_id: '9', relation_fields: { Member_Status: 'Invited' } } });
    expect(call(0)).toMatchObject({ method: 'PUT', url: 'https://www.zohoapis.eu/crm/v8/Campaigns/1/Contacts', body: { data: [{ Member_Status: 'Invited', id: '9' }] } });
  });

  it('list_related_records fails when Zoho cannot list related lists, instead of returning only ids', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: { code: 'INTERNAL_ERROR', message: 'boom' } }));
    await expect(runAction({ action: listRelatedRecordsAtomic, auth: AUTH_EU, propsValue: RELATED })).rejects.toThrow(/INTERNAL_ERROR/);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('list_related_records falls back to id only when the user may not read field metadata', async () => {
    ok({ body: { related_lists: [{ api_name: 'Contacts', module: { api_name: 'Contacts' } }] } });
    sendRequest.mockRejectedValueOnce(httpError({ status: 403, body: { code: 'NO_PERMISSION', message: 'permission denied' } }));
    ok({ body: { data: [{ id: '5' }], info: { more_records: false } } });
    const out = await runAction({ action: listRelatedRecordsAtomic, auth: AUTH_EU, propsValue: RELATED });
    expect(call(2).queryParams.fields).toBe('id');
    expect(out).toMatchObject({ count: 1 });
  });

  it('parses attachment file names', () => {
    expect(fileNameFromDisposition({ header: 'attachment; filename="report.pdf"', fallback: 'x' })).toBe('report.pdf');
    expect(fileNameFromDisposition({ header: "attachment; filename*=UTF-8''r%C3%A9sum%C3%A9.pdf", fallback: 'x' })).toBe('résumé.pdf');
    expect(fileNameFromDisposition({ header: undefined, fallback: 'fallback' })).toBe('fallback');
  });
});

describe('output schemas', () => {
  it('get_record and download_attachment describe what run() returns', () => {
    expect(getRecordAtomic.outputSchema?.fields.map((f) => f.key)).toEqual(['id', 'Created_Time', 'Modified_Time', 'record']);
    expect(downloadAttachmentAtomic.outputSchema?.fields.map((f) => f.key)).toEqual(['file', 'file_name', 'size', 'content_type']);
  });
});

describe('email draft partial update', () => {
  const current = {
    id: 'abc',
    from: 'me@x.com',
    to: [{ email: 'a@x.com', user_name: 'A' }],
    cc: [{ email: 'c@x.com' }],
    subject: 'Old subject',
    content: '<p>Old</p>',
    rich_text: true,
    schedule_details: { time: '2026-11-30T18:40:00+05:30' },
    attachments: [{ id: 'att', file_name: 'f.txt' }],
  };

  it('keeps every field not passed', () => {
    const merged = mergeDraft({ current, changes: { subject: 'New' }, draft: 'abc' });
    expect(merged).toEqual({
      id: 'abc',
      from: 'me@x.com',
      rich_text: true,
      to: [{ email: 'a@x.com', user_name: 'A' }],
      cc: [{ email: 'c@x.com' }],
      subject: 'New',
      content: '<p>Old</p>',
      schedule_details: { time: '2026-11-30T18:40:00+05:30' },
      attachments: [{ id: 'att', file_name: 'f.txt' }],
    });
  });

  it('reads first, then PUTs /{module}/{id}/__email_drafts with the merged draft', async () => {
    ok({ body: { __email_drafts: [current] } });
    ok({ body: { __email_drafts: [{ code: 'SUCCESS', status: 'success', details: { id: 'abc' } }] } });
    const out = await runAction({ action: updateEmailDraftAtomic, auth: AUTH_EU, propsValue: { ...DRAFT, module_api_name: 'Leads', record_id: '1', draft_id: 'abc', to: ['z@x.com'] } });
    expect(call(0).url).toBe('https://www.zohoapis.eu/crm/v8/Leads/1/__email_drafts/abc');
    expect(call(1).method).toBe('PUT');
    expect(call(1).url).toBe('https://www.zohoapis.eu/crm/v8/Leads/1/__email_drafts');
    expect(call(1).body.__email_drafts[0]).toMatchObject({ id: 'abc', from: 'me@x.com', to: [{ email: 'z@x.com' }], subject: 'Old subject', cc: [{ email: 'c@x.com' }] });
    expect(out).toMatchObject({ id: 'abc', status: 'success' });
  });
});
