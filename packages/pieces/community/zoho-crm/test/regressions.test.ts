import { PropertyType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addTagsToRecordAction } from '../src/lib/actions/add-tags-to-record';
import { convertLeadAction } from '../src/lib/actions/convert-lead';
import { createRecordAction } from '../src/lib/actions/create-record';
import { getRecordAction } from '../src/lib/actions/get-record';
import { updateRecordAction } from '../src/lib/actions/update-record';
import { newRecordTrigger } from '../src/lib/triggers/new-record';
import { updatedRecordTrigger } from '../src/lib/triggers/updated-record';
import { AUTH, asPolling, call, enableTrigger, httpError, memoryStore, ok, propertyContext, runAction, runTrigger, sendRequest } from './helpers';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  const { mockHttpClient } = await import('./helpers');
  return { ...actual, ...mockHttpClient() };
});

const CURSOR_KEY = 'zoho_poll_cursor';
const CREATE_DEFAULTS = { additional_fields: undefined, triggers: undefined, skip_automation: false };
const CONVERT_DEFAULTS = {
  account_id: undefined, contact_id: undefined, overwrite: false, assign_to: undefined, notify_lead_owner: false, notify_new_entity_owner: false,
  create_deal: false, deal_name: undefined, deal_stage: undefined, deal_closing_date: undefined, deal_amount: undefined, deal_pipeline: undefined, deal_extra: undefined,
};
const UPDATE_DEFAULTS = { additional_fields: undefined, skip_automation: false };
const T0 = Date.parse('2026-09-29T10:00:00+00:00');
const PAGE_SIZE = 200;

beforeEach(() => {
  sendRequest.mockReset();
});

describe('Array props sent as a JSON string (dynamic value toggle)', () => {
  it('update_record clears every field named in a JSON-string Clear Fields list', async () => {
    ok({ body: { fields: [{ api_name: 'Phone', data_type: 'phone' }] } });
    ok({ body: { data: [{ status: 'success', details: { id: '111' } }] } });
    await runAction({
      action: updateRecordAction,
      propsValue: { ...UPDATE_DEFAULTS, module: 'Leads', record_id: '111', fields: {}, clear_fields: ['["Phone", "Custom_Field__c"]'] },
    });
    expect(call(1).body).toEqual({ data: [{ Phone: null, Custom_Field__c: null }] });
  });

  it('add_tags_to_record keeps a comma inside a tag name given as a JSON array', async () => {
    ok({ body: { tags: [] } });
    ok({ body: { tags: [{ status: 'success', details: { id: '1' } }] } });
    ok({ body: { data: [{ status: 'success', details: { id: '111' } }] } });
    await runAction({ action: addTagsToRecordAction, propsValue: { module: 'Leads', record_id: '111', tags: undefined, new_tags: ['["Q4, EMEA"]'] } });
    expect(call(1).body).toEqual({ tags: [{ name: 'Q4, EMEA' }] });
    expect(call(2).body.tags).toEqual([{ name: 'Q4, EMEA' }]);
  });

  it('create_record reads a multi-select picklist given as a JSON array string', async () => {
    ok({ body: { fields: [{ api_name: 'Last_Name', data_type: 'text' }, { api_name: 'Interests__c', data_type: 'multiselectpicklist' }] } });
    ok({ body: { data: [{ status: 'success', details: { id: '9' } }] }, status: 201 });
    await runAction({ action: createRecordAction, propsValue: { ...CREATE_DEFAULTS, module: 'Leads', fields: { Last_Name: 'Doe', Interests__c: '["A", "B, C"]' } } });
    expect(call(1).body.data[0]).toEqual({ Last_Name: 'Doe', Interests__c: ['A', 'B, C'] });
  });
});

describe('field metadata failures', () => {
  it('create_record fails instead of sending unconverted values when the field list returns a 500', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 500, body: { code: 'INTERNAL_ERROR', message: 'boom' } }));
    await expect(
      runAction({ action: createRecordAction, propsValue: { ...CREATE_DEFAULTS, module: 'Leads', fields: { Annual_Revenue: '10' } } }),
    ).rejects.toThrow(/INTERNAL_ERROR/);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('create_record still works with raw values when the user may not read field metadata', async () => {
    sendRequest.mockRejectedValueOnce(httpError({ status: 403, body: { code: 'NO_PERMISSION', message: 'permission denied' } }));
    ok({ body: { data: [{ status: 'success', details: { id: '9' } }] }, status: 201 });
    await runAction({ action: createRecordAction, propsValue: { ...CREATE_DEFAULTS, module: 'Leads', fields: { Last_Name: 'Doe' } } });
    expect(call(1).body).toEqual({ data: [{ Last_Name: 'Doe' }] });
  });
});

describe('convert_lead pickers', () => {
  it('offers accounts, contacts and owners as dropdowns', async () => {
    const props = convertLeadAction.props;
    expect(props.account_id.type).toBe(PropertyType.DROPDOWN);
    expect(props.contact_id.type).toBe(PropertyType.DROPDOWN);
    expect(props.assign_to.type).toBe(PropertyType.DROPDOWN);
  });

  it('lists every active user across pages for the owner dropdown', async () => {
    ok({ body: { users: [{ id: '1', full_name: 'Ann', email: 'ann@x.com' }], info: { more_records: true } } });
    ok({ body: { users: [{ id: '2', full_name: 'Bob' }], info: { more_records: false } } });
    const state = await convertLeadAction.props.assign_to.options({ auth: AUTH }, propertyContext());
    expect(state.options).toEqual([
      { label: 'Ann (ann@x.com)', value: '1' },
      { label: 'Bob', value: '2' },
    ]);
    expect(call(0).queryParams).toMatchObject({ type: 'ActiveUsers', page: '1' });
    expect(call(1).queryParams).toMatchObject({ page: '2' });
  });
});

describe('convert_lead into an existing record', () => {
  it('explains Zoho\'s matching rule when the account does not match the lead', async () => {
    sendRequest.mockRejectedValueOnce(
      httpError({ status: 400, body: { data: [{ code: 'INVALID_DATA', status: 'error', message: "Account data doesn't match perfectly with the Lead data", details: { api_name: 'id' } }] } }),
    );
    await expect(
      runAction({ action: convertLeadAction, propsValue: { ...CONVERT_DEFAULTS, lead_id: '1', account_id: '2' } }),
    ).rejects.toThrow(/Account data doesn't match the lead\. Zoho links an existing account only when the lead's Company equals the account name/);
  });
});

describe('get_record output', () => {
  it('describes the record id and times and exposes every field', () => {
    const fields = getRecordAction.outputSchema?.fields ?? [];
    expect(fields.map((f) => f.key)).toEqual(['id', 'Created_Time', 'Modified_Time', 'record']);
    expect(fields[3]).toMatchObject({ value: '', dynamicKey: true });
  });
});

describe('polling bursts larger than one poll can read', () => {
  it('new_record emits every record of a 6,000-record burst across polls, once each', async () => {
    const server = fakeLeads({ count: 6000 });
    const { store } = memoryStore();
    await store.put(CURSOR_KEY, { time: T0, ids: [] });
    const propsValue = { module: 'Leads', fields: ['Email'] };
    const first = await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue, store });
    server.prepend({ count: 3 });
    const second = await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue, store });
    const third = await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue, store });
    const fourth = await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue, store });
    const emitted = [...first, ...second, ...third, ...fourth].map(idOf);
    expect(new Set(emitted).size).toBe(emitted.length);
    expect(emitted).toHaveLength(6003);
    expect(fourth).toEqual([]);
  });

  it('updated_record restarts from the top when Zoho rejects a stored page token, without re-emitting', async () => {
    const server = fakeLeads({ count: 5400, modified: true });
    const { store } = memoryStore();
    await store.put(CURSOR_KEY, { time: T0, ids: [] });
    const propsValue = { module: 'Leads', fields: ['Email'], include_new: true };
    const first = await runTrigger({ trigger: asPolling(updatedRecordTrigger), propsValue, store });
    server.expireTokens();
    const rest = [
      ...(await runTrigger({ trigger: asPolling(updatedRecordTrigger), propsValue, store })),
      ...(await runTrigger({ trigger: asPolling(updatedRecordTrigger), propsValue, store })),
    ];
    const emitted = [...first, ...rest].map(idOf);
    expect(first).toHaveLength(5000);
    expect(new Set(emitted).size).toBe(5400);
    expect(emitted).toHaveLength(5400);
  });
});

function idOf(record: unknown): string {
  if (typeof record === 'object' && record !== null && 'id' in record && typeof record.id === 'string') {
    return record.id;
  }
  throw new Error('record without id');
}

function fakeLeads({ count, modified = false }: { count: number; modified?: boolean }) {
  const timeField = modified ? 'Modified_Time' : 'Created_Time';
  const make = ({ index }: { index: number }) => {
    const time = new Date(T0 + (index + 1) * 1000).toISOString().replace('.000Z', '+00:00');
    return { id: `r${index}`, Created_Time: modified ? '2026-01-01T00:00:00+00:00' : time, Modified_Time: time };
  };
  let records = Array.from({ length: count }, (_, index) => make({ index })).reverse();
  let generation = 0;
  let next = count;
  sendRequest.mockImplementation(async (request: { url: string; queryParams: Record<string, string> }) => {
    const token = request.queryParams['page_token'];
    const [tokenGeneration, tokenPage] = (token ?? '').split(':');
    if (token !== undefined && Number(tokenGeneration) !== generation) {
      throw httpError({ status: 400, body: { code: 'INVALID_DATA', message: 'page_token expired' } });
    }
    const page = token !== undefined ? Number(tokenPage) : Number(request.queryParams['page']);
    if (token === undefined && page > 10) {
      throw httpError({ status: 400, body: { code: 'INVALID_DATA', message: 'use page_token beyond 2000 records' } });
    }
    const data = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const more = page * PAGE_SIZE < records.length;
    expect(request.queryParams['sort_by']).toBe(timeField);
    return { status: 200, headers: {}, body: { data, info: { more_records: more, next_page_token: more ? `${generation}:${page + 1}` : null } } };
  });
  return {
    prepend: ({ count: extra }: { count: number }) => {
      const fresh = Array.from({ length: extra }, (_, i) => make({ index: next + i })).reverse();
      next += extra;
      records = [...fresh, ...records];
    },
    expireTokens: () => {
      generation += 1;
    },
  };
}
