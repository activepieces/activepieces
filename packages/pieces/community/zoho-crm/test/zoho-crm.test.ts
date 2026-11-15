import { PropertyType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'node:stream';
import { tokenHosts, zohoTokenUrl } from '../src/lib/common/host-guard';
import { readFile } from '../src/lib/actions/read-file';
import { contactFieldsParam, newContact } from '../src/lib/triggers/new-contact';
import { newRecordTrigger } from '../src/lib/triggers/new-record';
import { isUpdateOnly, updatedRecordTrigger } from '../src/lib/triggers/updated-record';
import { collectSince, CURSOR_KEY, PollCursor, ZohoRecord } from '../src/lib/common/polling';
import { buildFieldProps, buildRecordPayload, convertFieldValue, FIELDS_JSON_KEY, fieldsJsonFallbackProp, isApiReadOnly } from '../src/lib/common/fields';
import { defaultFieldSelection, ZohoField } from '../src/lib/common/metadata';
import { flattenAttachment } from '../src/lib/common/flatten';
import { buildMultipart, deleteRecord, updateRecord } from '../src/lib/common/records';
import { customApiAuthHeaders, getApiDomain, stringList, toZohoError, unwrapWriteItem } from '../src/lib/common/client';
import { createRecordAction } from '../src/lib/actions/create-record';
import { updateRecordAction } from '../src/lib/actions/update-record';
import { zohoCrm } from '../src/index';
import { AUTH, asPolling, call, captureWrites, enableTrigger, httpError, memoryStore, ok, propertyContext, runAction, runTrigger, sendRequest } from './helpers';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  const { mockHttpClient } = await import('./helpers');
  return { ...actual, ...mockHttpClient() };
});

const LEAD_FIELDS: ZohoField[] = [
  { api_name: 'Last_Name', data_type: 'text', system_mandatory: true, field_label: 'Last Name' },
  { api_name: 'Email', data_type: 'email' },
  { api_name: 'Annual_Revenue', data_type: 'currency' },
  { api_name: 'Email_Opt_Out', data_type: 'boolean' },
  { api_name: 'Birth_Date__c', data_type: 'date' },
  { api_name: 'Next_Call__c', data_type: 'datetime' },
  { api_name: 'Lead_Status', data_type: 'picklist', pick_list_values: [{ display_value: '-None-', actual_value: '-None-' }, { display_value: 'Contacted', actual_value: 'Contacted' }] },
  { api_name: 'Interests__c', data_type: 'multiselectpicklist', pick_list_values: [{ actual_value: 'A' }, { actual_value: 'B' }] },
  { api_name: 'Account__c', data_type: 'lookup', lookup: { module: { api_name: 'Accounts' } } },
  { api_name: 'Owner', data_type: 'ownerlookup' },
  { api_name: 'Notes__c', data_type: 'textarea' },
  { api_name: 'Score__c', data_type: 'formula', read_only: true },
  { api_name: 'Items', data_type: 'subform' },
  { api_name: 'Created_Time', data_type: 'datetime', read_only: true },
  { api_name: 'Hidden__c', data_type: 'text', visible: false },
];

beforeEach(() => {
  sendRequest.mockReset();
});

describe('token host guard', () => {
  const US = tokenHosts('https://www.zohoapis.com');
  it.each([
    'https://www.zohoapis.com/crm/v8/org',
    'https://www.zohoapis.com/crm/bulk/v2/read/1/result',
    'https://download-accl.zoho.com/v2/crm/123/backup/1/file.zip',
    'https://download.zoho.com/v2/crm/123/backup/1/file.zip',
  ])('allows %s for a US connection', (url) => {
    expect(zohoTokenUrl({ raw: url, hosts: US })).not.toBeNull();
  });

  it.each([
    'https://www.zohoapis.com/crm/v7/functions/fn/actions/execute?auth_type=apikey&zapikey=x',
    'https://www.zohoapis.com/crm/v7/%66unctions/fn/actions/execute',
    'https://www.zohoapis.com/oauth/v2/token',
    'https://accounts.zoho.com/oauth/v2/token',
    'https://www.zohoapis.eu/crm/v8/org',
    'https://download-accl.zoho.eu/v2/crm/1/backup/f.zip',
    'https://files.zohopublic.com/crm/x',
    'https://x.zohoexternal.com/crm/x',
    'https://zoho.com.evil.io/crm/x',
    'https://www.zohoapis.com.attacker.net/crm/x',
    'http://www.zohoapis.com/crm/v8/org',
    'https://user:pw@www.zohoapis.com/crm/v8/org',
    'https://www.zohoapis.com:8443/crm/v8/org',
    '//www.zohoapis.com/crm/v8/org',
    'not a url',
  ])('refuses %s for a US connection', (url) => {
    expect(zohoTokenUrl({ raw: url, hosts: US })).toBeNull();
  });

  it('builds the list from the connection data centre', () => {
    expect(tokenHosts('https://www.zohoapis.eu')).toEqual({ apiHost: 'www.zohoapis.eu', downloadHosts: ['download-accl.zoho.eu', 'download.zoho.eu'] });
    expect(tokenHosts('https://www.zohoapis.ca').downloadHosts).toEqual(['download-accl.zohocloud.ca', 'download.zohocloud.ca']);
    expect(tokenHosts('https://www.zohoapis.com.au').downloadHosts).toEqual(['download-accl.zoho.com.au', 'download.zoho.com.au']);
  });
});

describe('read-file download', () => {
  it('refuses a non-Zoho URL before any request', async () => {
    await expect(runAction({ action: readFile, propsValue: { url: 'https://attacker.example/steal' } })).rejects.toThrow(/Refusing to send the Zoho CRM token/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('streams from the Zoho host with the token and no automatic redirects', async () => {
    ok({ body: Readable.from([Buffer.from('ab'), Buffer.from('c')]) });
    const written = captureWrites();
    const out = await runAction({ action: readFile, propsValue: { url: 'https://download-accl.zoho.com/v2/crm/1/backup/Leads_001.zip?x=1' }, files: written.files });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(call(0)).toMatchObject({ headers: { Authorization: 'Zoho-oauthtoken tok-123' }, followRedirects: false, responseType: 'stream' });
    expect(out).toBe('file://stored');
    expect(written.calls).toEqual([{ fileName: 'Leads_001.zip', streamed: true, content: 'abc' }]);
  });

  it('follows redirects only between this connection\'s Zoho CRM file hosts, keeping the token there', async () => {
    ok({ body: undefined, status: 302, headers: { location: 'https://download.zoho.com/v2/crm/1/signed?x=1' } });
    ok({ body: Buffer.from('bytes') });
    const written = captureWrites();
    await runAction({ action: readFile, propsValue: { url: 'https://download-accl.zoho.com/v2/crm/1/backup/f.zip' }, files: written.files });
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(call(1)).toMatchObject({ url: 'https://download.zoho.com/v2/crm/1/signed?x=1', headers: { Authorization: 'Zoho-oauthtoken tok-123' } });
    expect(written.calls[0].content).toBe('bytes');
    sendRequest.mockReset();
    ok({ body: undefined, status: 302, headers: { location: 'http://download.zoho.com/v2/crm/1/f.zip' } });
    await expect(runAction({ action: readFile, propsValue: { url: 'https://download-accl.zoho.com/v2/crm/1/backup/f.zip' } })).rejects.toThrow(/non-https/);
  });
});

describe('new_contact fixes', () => {
  it('requests the same 46 fields when no extras are chosen', () => {
    const fields = contactFieldsParam(undefined).split(',');
    expect(fields).toHaveLength(46);
    expect(fields[0]).toBe('Owner');
    expect(fields[45]).toBe('Account_Name');
  });

  it('adds at most 4 extras, deduped', () => {
    const fields = contactFieldsParam(['Email', 'C1__c', 'C2__c', 'C3__c', 'C4__c', 'C5__c', 'C1__c']).split(',');
    expect(fields).toHaveLength(50);
    expect(fields.slice(46)).toEqual(['C1__c', 'C2__c', 'C3__c', 'C4__c']);
  });

  it('sends per_page (not perPage) and survives a 204', async () => {
    const { store } = memoryStore();
    await store.put('lastPoll', 0);
    ok({ body: undefined, status: 204 });
    const out = await runTrigger({ trigger: asPolling(newContact), propsValue: { additional_fields: undefined }, store });
    expect(out).toEqual([]);
    expect(call(0).queryParams.per_page).toBe('200');
    expect(call(0).queryParams.perPage).toBeUndefined();
  });
});

describe('polling cursor', () => {
  const T0 = Date.parse('2026-09-29T10:00:00+00:00');
  const rec = ({ id, secondsAfter }: { id: string; secondsAfter: number }): ZohoRecord => ({
    id,
    Created_Time: new Date(T0 + secondsAfter * 1000).toISOString().replace('.000Z', '+00:00'),
  });
  const onePage = ({ records }: { records: ZohoRecord[] }) => async () => ({ records, more: false });

  it('stops at the checkpoint and returns oldest first', async () => {
    const r = await collectSince({
      cursor: { time: T0, ids: [] },
      timeField: 'Created_Time',
      fetchPage: async () => ({ records: [rec({ id: '3', secondsAfter: 30 }), rec({ id: '2', secondsAfter: 20 }), rec({ id: '1', secondsAfter: -5 })], more: true, nextPageToken: 't2' }),
    });
    expect(r.records.map((x) => x.id)).toEqual(['2', '3']);
    expect(r.cursor).toEqual({ time: T0 + 30000, ids: ['3'] });
    expect(r.truncated).toBe(false);
  });

  it('keeps same-second records not emitted yet, skips those already emitted', async () => {
    const cursor: PollCursor = { time: T0, ids: ['a'] };
    const r = await collectSince({ cursor, timeField: 'Created_Time', fetchPage: onePage({ records: [rec({ id: 'b', secondsAfter: 0 }), rec({ id: 'a', secondsAfter: 0 })] }) });
    expect(r.records.map((x) => x.id)).toEqual(['b']);
    expect(r.cursor).toEqual({ time: T0, ids: ['a', 'b'] });
  });

  it('pages with next_page_token until it passes the checkpoint', async () => {
    const fetchPage = vi.fn(async ({ pageToken }: { pageToken?: string }) =>
      pageToken === undefined
        ? { records: [rec({ id: '4', secondsAfter: 40 }), rec({ id: '3', secondsAfter: 30 })], more: true, nextPageToken: 't2' }
        : { records: [rec({ id: '2', secondsAfter: 20 }), rec({ id: '1', secondsAfter: -1 })], more: true, nextPageToken: 't3' },
    );
    const r = await collectSince({ cursor: { time: T0, ids: [] }, timeField: 'Created_Time', fetchPage });
    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage.mock.calls[1][0]).toEqual({ pageToken: 't2' });
    expect(r.records.map((x) => x.id)).toEqual(['2', '3', '4']);
  });

  it('keeps a backlog instead of skipping records when the page budget runs out', async () => {
    const fetchPage = vi.fn(async ({ pageToken }: { pageToken?: string }) => {
      const page = pageToken === undefined ? 1 : Number(pageToken);
      return { records: [rec({ id: `p${page}`, secondsAfter: 1000 - page })], more: true, nextPageToken: String(page + 1) };
    });
    const r = await collectSince({ cursor: { time: T0, ids: [] }, timeField: 'Created_Time', fetchPage, maxPages: 3 });
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(r.truncated).toBe(true);
    expect(r.records.map((x) => x.id)).toEqual(['p3', 'p2', 'p1']);
    expect(r.cursor).toEqual({
      time: T0,
      ids: [],
      backlog: { pageToken: '4', top: { time: T0 + 999000, ids: ['p1'] }, floor: { time: T0 + 997000, ids: ['p3'] } },
    });
  });

  it('fails loudly when Zoho reports more records without a page token', async () => {
    await expect(
      collectSince({ cursor: { time: T0, ids: [] }, timeField: 'Created_Time', fetchPage: async () => ({ records: [rec({ id: '1', secondsAfter: 5 })], more: true }) }),
    ).rejects.toThrow(/next_page_token/);
  });

  it('leaves the cursor alone when nothing is new', async () => {
    const cursor = { time: T0, ids: ['x'] };
    const r = await collectSince({ cursor, timeField: 'Created_Time', fetchPage: onePage({ records: [] }) });
    expect(r.cursor).toBe(cursor);
  });

  it('new_record trigger: sorts by Created_Time, stores the cursor, re-poll emits nothing', async () => {
    const { store, read } = memoryStore();
    await store.put(CURSOR_KEY, { time: T0, ids: [] });
    ok({ body: { fields: [{ api_name: 'Last_Name' }, { api_name: 'Custom__c' }] } });
    ok({ body: { data: [rec({ id: '2', secondsAfter: 20 }), rec({ id: '1', secondsAfter: 10 })], info: { more_records: false } } });
    const out = await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue: { module: 'Leads', fields: undefined }, store });
    expect(out.map(idOf)).toEqual(['1', '2']);
    const q = call(1).queryParams;
    expect(call(1).url).toBe('https://www.zohoapis.com/crm/v8/Leads');
    expect(q).toMatchObject({ sort_by: 'Created_Time', sort_order: 'desc', per_page: '200', page: '1' });
    expect(q.fields.split(',')).toEqual(expect.arrayContaining(['id', 'Created_Time', 'Modified_Time', 'Last_Name', 'Custom__c']));
    expect(read(CURSOR_KEY)).toEqual({ time: T0 + 20000, ids: ['2'] });
    ok({ body: { data: [rec({ id: '2', secondsAfter: 20 }), rec({ id: '1', secondsAfter: 10 })], info: { more_records: false } } });
    const again = await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue: { module: 'Leads', fields: undefined }, store });
    expect(again).toEqual([]);
    expect(sendRequest).toHaveBeenCalledTimes(3);
    expect(call(2).url).toBe('https://www.zohoapis.com/crm/v8/Leads');
  });

  it('updated_record skips records only created, unless include_new', async () => {
    const created = { id: '1', Created_Time: '2026-09-29T10:00:05+00:00', Modified_Time: '2026-09-29T10:00:05+00:00' };
    const edited = { id: '2', Created_Time: '2026-09-28T10:00:00+00:00', Modified_Time: '2026-09-29T10:00:06+00:00' };
    expect(isUpdateOnly(created)).toBe(false);
    expect(isUpdateOnly(edited)).toBe(true);
    const { store, read } = memoryStore();
    await store.put(CURSOR_KEY, { time: T0, ids: [] });
    ok({ body: { data: [edited, created], info: { more_records: false } } });
    const out = await runTrigger({ trigger: asPolling(updatedRecordTrigger), propsValue: { module: 'Leads', fields: ['Email'], include_new: false }, store });
    expect(out.map(idOf)).toEqual(['2']);
    expect(call(0).queryParams.sort_by).toBe('Modified_Time');
    expect(read(CURSOR_KEY)).toEqual({ time: Date.parse('2026-09-29T10:00:06+00:00'), ids: ['2'] });
  });

  it('onEnable keeps an existing cursor on republish', async () => {
    const { store, read } = memoryStore();
    await store.put(CURSOR_KEY, { time: 5, ids: [] });
    await enableTrigger({ trigger: asPolling(newRecordTrigger), propsValue: { module: 'Leads', fields: undefined }, store, isRepublish: true });
    expect(read(CURSOR_KEY)).toEqual({ time: 5, ids: [] });
  });
});

describe('field mapping', () => {
  it('maps data types to props and skips non-writable fields', () => {
    const props = buildFieldProps({ fields: LEAD_FIELDS, mode: 'create' });
    expect(Object.keys(props)).toEqual([
      'Last_Name', 'Email', 'Annual_Revenue', 'Email_Opt_Out', 'Birth_Date__c', 'Next_Call__c',
      'Lead_Status', 'Interests__c', 'Account__c', 'Owner', 'Notes__c',
    ]);
    expect(props['Last_Name'].required).toBe(true);
    expect(props['Annual_Revenue'].type).toBe('NUMBER');
    expect(props['Email_Opt_Out'].type).toBe('STATIC_DROPDOWN');
    expect(props['Birth_Date__c'].type).toBe('SHORT_TEXT');
    expect(props['Next_Call__c'].type).toBe('DATE_TIME');
    expect(props['Interests__c'].type).toBe('STATIC_MULTI_SELECT_DROPDOWN');
    expect(props['Notes__c'].type).toBe('LONG_TEXT');
    const status = props['Lead_Status'];
    if (status.type !== PropertyType.STATIC_DROPDOWN) {
      throw new Error('Lead_Status is not a static dropdown');
    }
    expect(status.options.options.map((o) => o.value)).toEqual(['Contacted']);
  });

  it('marks nothing required on update', () => {
    const props = buildFieldProps({ fields: LEAD_FIELDS, mode: 'update' });
    expect(Object.values(props).every((p) => p.required === false)).toBe(true);
  });

  it('converts values to the Zoho format', () => {
    const convert = ({ api, value }: { api: string; value: unknown }) => convertFieldValue({ field: LEAD_FIELDS.find((x) => x.api_name === api), value });
    expect(convert({ api: 'Annual_Revenue', value: '1200.5' })).toBe(1200.5);
    expect(convert({ api: 'Email_Opt_Out', value: 'false' })).toBe(false);
    expect(convert({ api: 'Birth_Date__c', value: '2026-10-01T00:00:00.000Z' })).toBe('2026-10-01');
    expect(convert({ api: 'Next_Call__c', value: '2026-10-01T09:00:00.000Z' })).toBe('2026-10-01T09:00:00+00:00');
    expect(convert({ api: 'Next_Call__c', value: '2026-10-01T09:00:00+02:00' })).toBe('2026-10-01T09:00:00+02:00');
    expect(convert({ api: 'Account__c', value: '5725767000000524157' })).toEqual({ id: '5725767000000524157' });
    expect(convert({ api: 'Interests__c', value: 'A, B' })).toEqual(['A', 'B']);
    expect(() => convert({ api: 'Annual_Revenue', value: 'abc' })).toThrow(/number/);
    expect(convertFieldValue({ field: undefined, value: 'raw' })).toBe('raw');
  });

  it('keeps 19-digit ids as strings', () => {
    const lookup = LEAD_FIELDS.find((x) => x.api_name === 'Account__c');
    expect(convertFieldValue({ field: lookup, value: '9007199254740993123' })).toEqual({ id: '9007199254740993123' });
  });

  it('falls back to a JSON "fields" prop and reads it back', () => {
    const props = fieldsJsonFallbackProp({ reason: 'HTTP 500', mode: 'create' });
    expect(Object.keys(props)).toEqual([FIELDS_JSON_KEY]);
    expect(props[FIELDS_JSON_KEY].type).toBe('JSON');
    const payload = buildRecordPayload({ dynamicValues: { [FIELDS_JSON_KEY]: { Last_Name: 'Doe' } }, fields: undefined });
    expect(payload).toEqual({ Last_Name: 'Doe' });
  });

  it('dynamic props fall back when metadata fails to load', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: { code: 'INTERNAL_ERROR', message: 'boom' } }));
    const props = await createRecordAction.props.fields.props({ auth: AUTH, module: 'Leads' }, propertyContext());
    expect(Object.keys(props)).toEqual([FIELDS_JSON_KEY]);
  });
});

describe('partial updates', () => {
  it('omits blank values, sends clears as null, dedicated props win over extra JSON', () => {
    const payload = buildRecordPayload({
      dynamicValues: { Email: 'new@x.com', Lead_Status: undefined, Notes__c: '', Interests__c: [], Email_Opt_Out: 'false' },
      fields: LEAD_FIELDS,
      extraFields: { Email: 'old@x.com', Custom__c: 'k' },
      clearFields: ['Phone'],
    });
    expect(payload).toEqual({ Email: 'new@x.com', Custom__c: 'k', Email_Opt_Out: false, Phone: null });
  });

  it('update_record sends only the set fields via PUT /{module}/{id}', async () => {
    ok({ body: { fields: LEAD_FIELDS } });
    ok({ body: { data: [{ code: 'SUCCESS', status: 'success', message: 'record updated', details: { id: '111', Modified_Time: '2026-09-29T10:00:00+02:00' } }] } });
    const out = await runAction({
      action: updateRecordAction,
      propsValue: { module: 'Leads', record_id: '111', fields: { Email: 'n@x.com', Last_Name: '' }, clear_fields: [], additional_fields: undefined, skip_automation: false },
    });
    expect(call(1).method).toBe('PUT');
    expect(call(1).url).toBe('https://www.zohoapis.com/crm/v8/Leads/111');
    expect(call(1).body).toEqual({ data: [{ Email: 'n@x.com' }] });
    expect(out).toMatchObject({ id: '111', status: 'success', module: 'Leads' });
  });

  it('refuses an empty update', async () => {
    await expect(updateRecord({ auth: AUTH, module: 'Leads', id: '1', record: {} })).rejects.toThrow(/no fields/);
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('adds $append_values for multi-select appends', async () => {
    ok({ body: { data: [{ status: 'success', details: { id: '1' } }] } });
    await updateRecord({ auth: AUTH, module: 'Leads', id: '1', record: { Interests__c: ['C'] }, appendMultiSelect: ['Interests__c'] });
    expect(call(0).body.data[0]).toEqual({ Interests__c: ['C'], $append_values: { Interests__c: true } });
  });
});

describe('writes and errors', () => {
  it('create_record passes trigger [] when automation is skipped', async () => {
    ok({ body: { fields: LEAD_FIELDS } });
    ok({ body: { data: [{ code: 'SUCCESS', status: 'success', details: { id: '9', Created_By: { id: '5', name: 'Jane' } } }] }, status: 201 });
    const out = await runAction({ action: createRecordAction, propsValue: { module: 'Leads', fields: { Last_Name: 'Doe', Annual_Revenue: '10' }, additional_fields: undefined, triggers: undefined, skip_automation: true } });
    expect(call(1).body).toEqual({ data: [{ Last_Name: 'Doe', Annual_Revenue: 10 }], trigger: [] });
    expect(out).toMatchObject({ id: '9', created_by_name: 'Jane' });
  });

  it('throws on a per-record error inside a 207', () => {
    expect(() => unwrapWriteItem({ body: { data: [{ code: 'INVALID_DATA', status: 'error', message: 'invalid data', details: { api_name: 'Email' } }] } })).toThrow(
      /INVALID_DATA.*field: Email/,
    );
  });

  it('maps OAUTH_SCOPE_MISMATCH to a reconnect hint', () => {
    const e = toZohoError(httpError({ status: 401, body: { code: 'OAUTH_SCOPE_MISMATCH', message: 'invalid oauth scope' } }));
    expect(e.message).toMatch(/OAUTH_SCOPE_MISMATCH \(HTTP 401\).*scope/);
  });

  it('names a 429 without a Zoho code as TOO_MANY_REQUESTS', () => {
    const e = toZohoError(httpError({ status: 429, body: { message: 'slow down' } }));
    expect(e.message).toMatch(/^Zoho CRM TOO_MANY_REQUESTS \(HTTP 429\): slow down/);
  });

  it('custom API call refuses a connection without api_domain, else sends Zoho-oauthtoken', () => {
    expect(() => customApiAuthHeaders({ auth: { access_token: 't', data: {} }, url: '/org' })).toThrow(/Reconnect/);
    const eu = { access_token: 't', data: { api_domain: 'https://www.zohoapis.eu' } };
    expect(customApiAuthHeaders({ auth: eu, url: '/org' })).toEqual({ Authorization: 'Zoho-oauthtoken t' });
    expect(customApiAuthHeaders({ auth: eu, url: 'https://www.zohoapis.eu/crm/v8/org' })).toEqual({ Authorization: 'Zoho-oauthtoken t' });
    for (const url of ['https://evil.example/x', 'https://www.zohoapis.eu.evil.io/x', 'http://www.zohoapis.eu/crm/v8/org', 'https://www.zohoapis.com/crm/v8/org']) {
      expect(() => customApiAuthHeaders({ auth: eu, url })).toThrow(/only to https:\/\/www\.zohoapis\.eu/);
    }
  });

  it('falls back to the documented API domain for the location when api_domain is missing', () => {
    expect(getApiDomain({ data: { api_domain: 'https://www.zohoapis.eu/' }, props: { location: 'zoho.com' } })).toBe('https://www.zohoapis.eu');
    expect(getApiDomain({ data: {}, props: { location: 'zoho.com' } })).toBe('https://www.zohoapis.com');
    expect(getApiDomain({ data: {}, props: { location: 'zohocloud.ca' } })).toBe('https://www.zohoapis.ca');
    expect(() => getApiDomain({ data: {}, props: { location: 'zoho.evil' } })).toThrow(/Reconnect/);
  });

  it('registers every action and trigger', () => {
    expect(Object.keys(zohoCrm.actions())).toEqual(expect.arrayContaining(['read-file', 'create_record', 'update_record', 'get_record', 'upsert_record', 'delete_record', 'convert_lead', 'add_note', 'add_tags_to_record', 'upload_attachment', 'custom_api_call']));
    expect(Object.keys(zohoCrm.triggers()).sort()).toEqual(['new_contact', 'new_record', 'updated_record']);
  });
});

describe('list inputs', () => {
  it('parses a JSON array string, a JSON string inside an array, and plain comma text', () => {
    expect(stringList('["a, b", "c"]')).toEqual(['a, b', 'c']);
    expect(stringList(['["x"]', 'y'])).toEqual(['x', 'y']);
    expect(stringList('a, b')).toEqual(['a', 'b']);
    expect(stringList(['[VIP]'])).toEqual(['[VIP]']);
    expect(stringList(undefined)).toEqual([]);
  });
});

describe('multipart encoder', () => {
  it('builds a file part and a text part', () => {
    const { body, contentType } = buildMultipart({
      parts: [{ name: 'file', filename: 'a"b.txt', data: Buffer.from('hi') }, { name: 'title', data: 'T' }],
      boundary: 'BOUND',
    });
    expect(contentType).toBe('multipart/form-data; boundary=BOUND');
    const text = body.toString();
    expect(text).toContain('Content-Disposition: form-data; name="file"; filename="a_b.txt"\r\nContent-Type: application/octet-stream\r\n\r\nhi\r\n');
    expect(text).toContain('name="title"\r\n\r\nT\r\n');
    expect(text.endsWith('--BOUND--\r\n')).toBe(true);
  });
});

describe('tier-2 fixes', () => {
  it('default field selection keeps custom fields when a module has more than 50 fields', () => {
    const standard: ZohoField[] = Array.from({ length: 60 }, (_, i) => ({ api_name: `Std_${i}` }));
    const fields: ZohoField[] = [
      { api_name: 'id' },
      { api_name: 'Latitude' },
      { api_name: 'Locked__s' },
      ...standard,
      { api_name: 'AP_Text', custom_field: true },
      { api_name: 'Hidden_Custom', custom_field: true, visible: false },
    ];
    const picked = defaultFieldSelection({ fields });
    expect(picked).toHaveLength(50);
    expect(picked.slice(0, 3)).toEqual(['id', 'AP_Text', 'Std_0']);
    expect(picked).not.toContain('Latitude');
    expect(picked).not.toContain('Hidden_Custom');
  });

  it('offers Owner in the record form although Zoho marks it field_read_only', () => {
    const props = buildFieldProps({ fields: [{ api_name: 'Owner', data_type: 'ownerlookup', field_read_only: true }, { api_name: 'Locked', data_type: 'text', field_read_only: true }], mode: 'create' });
    expect(Object.keys(props)).toEqual(['Owner']);
    expect(isApiReadOnly({ api_name: 'Owner', data_type: 'ownerlookup', read_only: true })).toBe(true);
  });

  it('explains a delete of a missing or already-deleted record', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 400, body: { data: [{ code: 'INVALID_DATA', status: 'error', message: 'record not deleted', details: {} }] } }));
    await expect(deleteRecord({ auth: AUTH, module: 'Leads', id: '1' })).rejects.toThrow(/could not delete Leads record 1; it does not exist or was already deleted/);
  });

  it('hints at WorkDrive when file attachments are not enabled', () => {
    const e = toZohoError(httpError({ status: 400, body: { code: 'INTEGRATION_NOT_ENABLED', message: 'This action requires WorkDrive integration.' } }));
    expect(e.message).toMatch(/INTEGRATION_NOT_ENABLED.*WorkDrive.*attach a link/);
  });

  it('flattens link attachments with type and link_url', () => {
    expect(flattenAttachment({ id: '1', File_Name: 'Site', Size: '0', $type: 'Link URL', $link_url: 'https://x.test/', $file_id: null })).toMatchObject({
      size: 0,
      type: 'Link URL',
      link_url: 'https://x.test/',
      file_id: null,
    });
  });
});

function idOf(record: unknown): string {
  if (typeof record === 'object' && record !== null && 'id' in record && typeof record.id === 'string') {
    return record.id;
  }
  throw new Error('record without id');
}
