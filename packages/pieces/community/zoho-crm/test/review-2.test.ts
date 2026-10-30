import { Readable } from 'node:stream';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { convertLeadAction } from '../src/lib/actions/convert-lead';
import { createRecordAction } from '../src/lib/actions/create-record';
import { downloadAttachmentAtomic } from '../src/lib/actions/ai/related-attachments';
import { newContact } from '../src/lib/triggers/new-contact';
import { newRecordTrigger } from '../src/lib/triggers/new-record';
import { AUTH, asPolling, call, captureWrites, enableTrigger, memoryStore, ok, propertyContext, runAction, runTrigger, sendRequest } from './helpers';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  const { mockHttpClient } = await import('./helpers');
  return { ...actual, ...mockHttpClient() };
});

const CURSOR_KEY = 'zoho_poll_cursor';
const T0 = Date.parse('2026-09-29T10:00:00+00:00');
const CREATE_DEFAULTS = { additional_fields: undefined, triggers: undefined, skip_automation: false };

beforeEach(() => {
  sendRequest.mockReset();
});

describe('a second with more than 5,000 records that is still open when first read', () => {
  it('emits records stamped later in that second, even though Zoho sorts them before the saved page token', async () => {
    const second = T0 + 60_000;
    const zoho = keysetZoho({ serverTime: second + 500 });
    zoho.add({ count: 5100, time: second });
    const { store } = memoryStore();
    await store.put(CURSOR_KEY, { time: T0, ids: [] });
    const propsValue = { module: 'Leads', fields: ['Email'] };
    const emitted = new Set<string>();
    const first = await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue, store });
    first.forEach((r) => emitted.add(idOf(r)));
    zoho.add({ count: 300, time: second });
    zoho.setServerTime(second + 120_000);
    for (let poll = 0; poll < 4; poll++) {
      const out = await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue, store });
      out.forEach((r) => emitted.add(idOf(r)));
    }
    expect(emitted.size).toBe(5400);
  });

  it('emits each record exactly once when the second had already closed at Zoho', async () => {
    const second = T0 + 60_000;
    const zoho = keysetZoho({ serverTime: second + 5_000 });
    zoho.add({ count: 5400, time: second });
    const { store } = memoryStore();
    await store.put(CURSOR_KEY, { time: T0, ids: [] });
    const propsValue = { module: 'Leads', fields: ['Email'] };
    const emitted: string[] = [];
    for (let poll = 0; poll < 4; poll++) {
      emitted.push(...(await runTrigger({ trigger: asPolling(newRecordTrigger), propsValue, store })).map(idOf));
    }
    expect(emitted).toHaveLength(5400);
    expect(new Set(emitted).size).toBe(5400);
  });
});

describe('New Contact upgraded from 0.3.x', () => {
  it('continues from the old lastPoll instead of skipping contacts created since then', async () => {
    const { store, read } = memoryStore();
    await store.put('lastPoll', T0);
    await enableTrigger({ trigger: asPolling(newContact), propsValue: { additional_fields: undefined }, store, isRepublish: true });
    expect(read(CURSOR_KEY)).toEqual({ time: T0 + 1, ids: [] });
    expect(read('lastPoll')).toBeUndefined();
    ok({
      body: {
        data: [
          { id: 'new', Created_Time: new Date(T0 + 1000).toISOString().replace('.000Z', '+00:00') },
          { id: 'old', Created_Time: new Date(T0).toISOString().replace('.000Z', '+00:00') },
        ],
        info: { more_records: false },
      },
    });
    const out = await runTrigger({ trigger: asPolling(newContact), propsValue: { additional_fields: undefined }, store });
    expect(out.map(idOf)).toEqual(['new']);
  });
});

describe('record pickers', () => {
  it('say when only the 200 most recent records are listed', async () => {
    ok({ body: { fields: [{ api_name: 'Account_Name' }] } });
    ok({ body: { data: [{ id: '1', Account_Name: 'Acme' }], info: { more_records: true } } });
    const state = await convertLeadAction.props.account_id.options({ auth: AUTH }, propertyContext());
    expect(state.options).toEqual([{ label: 'Acme (1)', value: '1' }]);
    expect(state.placeholder).toMatch(/most recently modified records; map a record id/);
  });
});

describe('field values', () => {
  it('refuses a date with trailing text and keeps the date part of a full date-time as written', async () => {
    ok({ body: { fields: [{ api_name: 'Last_Name', data_type: 'text' }, { api_name: 'Day__c', data_type: 'date' }] } });
    await expect(
      runAction({ action: createRecordAction, propsValue: { ...CREATE_DEFAULTS, module: 'Leads', fields: { Last_Name: 'Doe', Day__c: '2026-10-01abc' } } }),
    ).rejects.toThrow(/yyyy-MM-dd/);
    ok({ body: { fields: [{ api_name: 'Last_Name', data_type: 'text' }, { api_name: 'Day__c', data_type: 'date' }] } });
    ok({ body: { data: [{ status: 'success', details: { id: '9' } }] }, status: 201 });
    await runAction({ action: createRecordAction, propsValue: { ...CREATE_DEFAULTS, module: 'Leads', fields: { Last_Name: 'Doe', Day__c: '2026-10-01T01:00:00+03:00' } } });
    expect(call(2).body.data[0].Day__c).toBe('2026-10-01');
  });

  it('sends long integers as the digit string Zoho expects and refuses more than 18 digits', async () => {
    ok({ body: { fields: [{ api_name: 'Last_Name', data_type: 'text' }, { api_name: 'Big__c', data_type: 'bigint' }] } });
    ok({ body: { data: [{ status: 'success', details: { id: '9' } }] }, status: 201 });
    await runAction({ action: createRecordAction, propsValue: { ...CREATE_DEFAULTS, module: 'Leads', fields: { Last_Name: 'Doe', Big__c: '12345' } } });
    expect(call(1).body.data[0].Big__c).toBe('12345');
    ok({ body: { fields: [{ api_name: 'Last_Name', data_type: 'text' }, { api_name: 'Big__c', data_type: 'bigint' }] } });
    await expect(
      runAction({ action: createRecordAction, propsValue: { ...CREATE_DEFAULTS, module: 'Leads', fields: { Last_Name: 'Doe', Big__c: '9007199254740993123' } } }),
    ).rejects.toThrow(/18 digits/);
    expect(sendRequest).toHaveBeenCalledTimes(3);
  });
});

describe('downloaded file names', () => {
  it.each([
    ["attachment; filename*=UTF-8'en'..%2F..%2Fetc%2Fpasswd", 'passwd'],
    ['attachment; filename="../../report\u0007.pdf"', 'report.pdf'],
    ['attachment; filename=".."', 'attachment-2'],
  ])('turns %s into a plain file name', async (disposition, expected) => {
    ok({ body: Readable.from([Buffer.from('x')]), headers: { 'content-disposition': disposition } });
    const written = captureWrites();
    await runAction({ action: downloadAttachmentAtomic, propsValue: { module_api_name: 'Leads', record_id: '1', attachment_id: '2' }, files: written.files });
    expect(written.calls[0].fileName).toBe(expected);
  });
});

function keysetZoho({ serverTime }: { serverTime: number }) {
  let records: { id: string; Created_Time: string; key: number; time: number }[] = [];
  let nextId = 1000;
  let now = serverTime;
  const stamp = (time: number) => new Date(time).toISOString().replace('.000Z', '+00:00');
  const order = () =>
    [...records].sort((a, b) => (b.time !== a.time ? b.time - a.time : b.key - a.key));
  sendRequest.mockImplementation(async (request: { queryParams: Record<string, string> }) => {
    const perPage = Number(request.queryParams['per_page'] ?? 200);
    const token = request.queryParams['page_token'];
    const sorted = order();
    let start = 0;
    if (token !== undefined) {
      const [time, key] = token.split(':');
      start = sorted.findIndex((r) => r.time < Number(time) || (r.time === Number(time) && r.key < Number(key)));
      if (start === -1) start = sorted.length;
    }
    const slice = sorted.slice(start, start + perPage);
    const more = start + perPage < sorted.length;
    const last = slice[slice.length - 1];
    return {
      status: 200,
      headers: { date: new Date(now).toUTCString() },
      body: {
        data: slice.map((r) => ({ id: r.id, Created_Time: r.Created_Time })),
        info: { more_records: more, next_page_token: more && last ? `${last.time}:${last.key}` : null },
      },
    };
  });
  return {
    add: ({ count, time }: { count: number; time: number }) => {
      const fresh = Array.from({ length: count }, () => {
        nextId += 1;
        return { id: `r${nextId}`, Created_Time: stamp(time), key: nextId, time };
      });
      records = [...records, ...fresh];
    },
    setServerTime: (time: number) => {
      now = time;
    },
  };
}

function idOf(record: unknown): string {
  if (typeof record === 'object' && record !== null && 'id' in record && typeof record.id === 'string') {
    return record.id;
  }
  throw new Error('record without id');
}
