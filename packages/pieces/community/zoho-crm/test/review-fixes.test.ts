import { Readable } from 'node:stream';
import { PropertyType } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addTagsToRecordAction } from '../src/lib/actions/add-tags-to-record';
import { convertLeadAction } from '../src/lib/actions/convert-lead';
import { createRecordAction } from '../src/lib/actions/create-record';
import { readFile } from '../src/lib/actions/read-file';
import { updateRecordAction } from '../src/lib/actions/update-record';
import { upsertRecordAction } from '../src/lib/actions/upsert-record';
import { downloadAttachmentAtomic, listRelatedRecordsAtomic } from '../src/lib/actions/ai/related-attachments';
import { listNotesAtomic } from '../src/lib/actions/ai/notes-tags';
import { updateRecordAtomic, upsertRecordAtomic } from '../src/lib/actions/ai/records';
import { newContact } from '../src/lib/triggers/new-contact';
import { newRecordTrigger } from '../src/lib/triggers/new-record';
import { zohoCrm } from '../src/index';
import { asPolling, call, captureWrites, enableTrigger, httpError, memoryStore, ok, propertyContext, runAction, runTrigger, sendRequest, AUTH } from './helpers';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  const { mockHttpClient } = await import('./helpers');
  return { ...actual, ...mockHttpClient() };
});

const CURSOR_KEY = 'zoho_poll_cursor';
const T0 = Date.parse('2026-09-29T10:00:00+00:00');
const STORE_VALUE_MAX_BYTES = 512 * 1024;
const CREATE_DEFAULTS = { additional_fields: undefined, triggers: undefined, skip_automation: false };

beforeEach(() => {
  sendRequest.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('polling: records that share one second', () => {
  it('emits every record of a 12,000-record import stamped with the same second, once each, and keeps the cursor under the store limit', async () => {
    const stamp = new Date(T0 + 5000).toISOString().replace('.000Z', '+00:00');
    const records = Array.from({ length: 12000 }, (_, i) => ({ id: `s${i}`, Created_Time: stamp, Email: null }));
    serveRecords({ records });
    const { store, read } = memoryStore();
    await store.put(CURSOR_KEY, { time: T0, ids: [] });
    const propsValue = { module: 'Leads', fields: ['Email'] };
    const emitted: string[] = [];
    const cursorSizes: number[] = [];
    for (let poll = 0; poll < 4; poll++) {
      const out = await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue, store });
      emitted.push(...out.map(idOf));
      cursorSizes.push(JSON.stringify(read(CURSOR_KEY)).length);
    }
    expect(emitted).toHaveLength(12000);
    expect(new Set(emitted).size).toBe(12000);
    expect(Math.max(...cursorSizes)).toBeLessThan(STORE_VALUE_MAX_BYTES);
  });

  it('seeds the cursor at a whole second of Zoho\'s clock, so records created in the enable second are not skipped', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(T0 + 4123);
    ok({ body: undefined, status: 204, headers: { date: new Date(T0 + 1000).toUTCString() } });
    const { store, read } = memoryStore();
    await enableTrigger({ trigger: asPolling(newRecordTrigger), propsValue: { module: 'Leads', fields: undefined }, store });
    expect(read(CURSOR_KEY)).toEqual({ time: T0 + 1000, ids: [] });
  });
});

describe('triggers: fields and metadata', () => {
  it('refuses more than 47 picked fields when the flow is published', async () => {
    const { store } = memoryStore();
    const fields = Array.from({ length: 48 }, (_, i) => `F${i}`);
    await expect(enableTrigger({ trigger: asPolling(newRecordTrigger), propsValue: { module: 'Leads', fields }, store })).rejects.toThrow(/at most 47/);
  });

  it('reads the default field list once, not on every poll', async () => {
    const { store } = memoryStore();
    await store.put(CURSOR_KEY, { time: T0, ids: [] });
    ok({ body: { fields: [{ api_name: 'Last_Name' }] } });
    ok({ body: undefined, status: 204 });
    ok({ body: undefined, status: 204 });
    const propsValue = { module: 'Leads', fields: undefined };
    await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue, store });
    await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue, store });
    const fieldCalls = sendRequest.mock.calls.filter(([request]) => String(request.url).endsWith('/settings/fields'));
    expect(fieldCalls).toHaveLength(1);
  });

  it('New Contact pages back to its last check instead of reading only the newest 200', async () => {
    const records = Array.from({ length: 450 }, (_, i) => ({ id: `c${i}`, Created_Time: new Date(T0 + (450 - i) * 1000).toISOString().replace('.000Z', '+00:00') }));
    serveRecords({ records });
    const { store } = memoryStore();
    await store.put(CURSOR_KEY, { time: T0, ids: [] });
    await store.put('lastPoll', T0);
    const out = await runTrigger({ trigger: asPolling(newContact), propsValue: { additional_fields: undefined }, store });
    expect(out).toHaveLength(450);
  });
});

describe('Read File and Download Attachment', () => {
  it.each([
    'https://www.zohoapis.com/crm/v7/functions/fn/actions/execute?auth_type=apikey&zapikey=attacker',
    'https://files.zohopublic.com/public/x.zip',
    'https://www.zohoapis.eu/crm/v8/org',
  ])('refuses %s for a US connection before any request', async (url) => {
    await expect(runAction({ action: readFile, propsValue: { url } })).rejects.toThrow(/Refusing to send the Zoho CRM token/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('Read File streams into the file store instead of buffering', async () => {
    ok({ body: Readable.from([Buffer.from('zip')]) });
    const written = captureWrites();
    await runAction({ action: readFile, propsValue: { url: 'https://download-accl.zoho.com/v2/crm/1/backup/f.zip' }, files: written.files });
    expect(call(0).responseType).toBe('stream');
    expect(written.calls).toEqual([{ fileName: 'f.zip', streamed: true, content: 'zip' }]);
  });

  it('Download Attachment streams, reports the size, and destroys the source when the store refuses the file', async () => {
    ok({ body: Readable.from([Buffer.from('%PDF-1')]), headers: { 'content-disposition': 'attachment; filename="p.pdf"', 'content-type': 'application/pdf' } });
    const written = captureWrites();
    const propsValue = { module_api_name: 'Leads', record_id: '1', attachment_id: '2' };
    const out = await runAction({ action: downloadAttachmentAtomic, propsValue, files: written.files });
    expect(call(0)).toMatchObject({ url: 'https://www.zohoapis.com/crm/v8/Leads/1/Attachments/2', responseType: 'stream', followRedirects: false });
    expect(out).toEqual({ file: 'file://stored', file_name: 'p.pdf', size: 6, content_type: 'application/pdf' });
    const source = Readable.from([Buffer.from('a'), Buffer.from('b')]);
    ok({ body: source });
    const tooBig = { write: async () => Promise.reject(new Error('File size exceeds the limit')), upload: vi.fn() };
    await expect(runAction({ action: downloadAttachmentAtomic, propsValue, files: tooBig })).rejects.toThrow(/exceeds the limit/);
    expect(source.destroyed).toBe(true);
  });
});

describe('Custom API Call', () => {
  it('does not send the token to a full URL on another host', async () => {
    const action = zohoCrm.actions()['custom_api_call'];
    const propsValue = { url: { url: 'https://attacker.example/collect' }, method: 'GET', headers: {}, queryParams: {} };
    await expect(runAction({ action, propsValue })).rejects.toThrow(/only to https:\/\/www\.zohoapis\.com/);
  });
});

describe('field types', () => {
  it('asks for dates as yyyy-MM-dd text, so the engine does not shift them to UTC', async () => {
    ok({ body: { fields: [{ api_name: 'Birthday__c', data_type: 'date' }, { api_name: 'Big__c', data_type: 'bigint' }] } });
    const props = await createRecordAction.props.fields.props({ auth: AUTH, module: 'Leads' }, propertyContext());
    expect(props['Birthday__c'].type).toBe(PropertyType.SHORT_TEXT);
    expect(convertLeadAction.props.deal_closing_date.type).toBe(PropertyType.SHORT_TEXT);
  });

  it('sends a long integer beyond 2^53 with every digit', async () => {
    ok({ body: { fields: [{ api_name: 'Last_Name', data_type: 'text' }, { api_name: 'Big__c', data_type: 'bigint' }] } });
    ok({ body: { data: [{ status: 'success', details: { id: '9' } }] }, status: 201 });
    await runAction({ action: createRecordAction, propsValue: { ...CREATE_DEFAULTS, module: 'Leads', fields: { Last_Name: 'Doe', Big__c: '900719925474099312' } } });
    expect(call(1).body.data[0].Big__c).toBe('900719925474099312');
  });

  it('refuses an impossible date instead of sending it', async () => {
    const propsValue = {
      lead_id: '1', account_id: undefined, contact_id: undefined, overwrite: false, assign_to: undefined, notify_lead_owner: false, notify_new_entity_owner: false,
      create_deal: true, deal_name: 'D', deal_stage: 'Qualification', deal_closing_date: '2026-13-01', deal_amount: undefined, deal_pipeline: undefined, deal_extra: undefined,
    };
    await expect(runAction({ action: convertLeadAction, propsValue })).rejects.toThrow(/yyyy-MM-dd/);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('metadata and inputs', () => {
  it('does not claim update and upsert are idempotent', () => {
    for (const action of [updateRecordAction, upsertRecordAction, updateRecordAtomic, upsertRecordAtomic]) {
      expect(action.aiMetadata?.idempotent).toBe(false);
    }
  });

  it('refuses pages past the 2,000-item window before any request', async () => {
    await expect(
      runAction({ action: listNotesAtomic, propsValue: { parent_module: 'Leads', parent_id: '1', page: 11, per_page: 200 } }),
    ).rejects.toThrow(/2,000/);
    await expect(
      runAction({
        action: listRelatedRecordsAtomic,
        propsValue: { module_api_name: 'Accounts', record_id: '1', related_list_api_name: 'Contacts', fields: ['id'], page: 11, per_page: 200, page_token: undefined },
      }),
    ).rejects.toThrow(/2,000/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('checks the tag count before creating any tag', async () => {
    const newTags = Array.from({ length: 11 }, (_, i) => `T${i}`);
    await expect(runAction({ action: addTagsToRecordAction, propsValue: { module: 'Leads', record_id: '1', tags: undefined, new_tags: newTags } })).rejects.toThrow(/at most 10/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('keeps the users already read when a later page of the Owner dropdown fails', async () => {
    ok({ body: { users: [{ id: '1', full_name: 'Ann' }], info: { more_records: true } } });
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: { code: 'INTERNAL_ERROR', message: 'boom' } }));
    const state = await convertLeadAction.props.assign_to.options({ auth: AUTH }, propertyContext());
    expect(state.options).toEqual([{ label: 'Ann', value: '1' }]);
    expect(state.disabled).toBe(false);
    expect(state.placeholder).toMatch(/first 1 users/);
  });

  it('names the parameter Zoho complains about', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 400, body: { code: 'INVALID_DATA', message: 'invalid data', details: { param_name: 'sort_by' } } }));
    await expect(runAction({ action: listNotesAtomic, propsValue: { parent_module: undefined, parent_id: undefined, page: undefined, per_page: undefined } })).rejects.toThrow(/parameter: sort_by/);
  });
});

function serveRecords({ records, serverTime = T0 + 3_600_000 }: { records: Record<string, unknown>[]; serverTime?: number }) {
  sendRequest.mockImplementation(async (request: { queryParams: Record<string, string> }) => {
    const token = request.queryParams['page_token'];
    const perPage = Number(request.queryParams['per_page'] ?? 200);
    const page = token !== undefined ? Number(token) : Number(request.queryParams['page'] ?? 1);
    if (token === undefined && page * perPage > 2000) {
      throw httpError({ status: 400, body: { code: 'DISCRETE_PAGINATION_LIMIT_EXCEEDED', message: 'use page_token' } });
    }
    const data = records.slice((page - 1) * perPage, page * perPage);
    const more = page * perPage < records.length;
    return { status: 200, headers: { date: new Date(serverTime).toUTCString() }, body: { data, info: { more_records: more, next_page_token: more ? String(page + 1) : null } } };
  });
}

function idOf(record: unknown): string {
  if (typeof record === 'object' && record !== null && 'id' in record && typeof record.id === 'string') {
    return record.id;
  }
  throw new Error('record without id');
}
