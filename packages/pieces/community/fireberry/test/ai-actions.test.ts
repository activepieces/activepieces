import { describe, expect, it, vi, afterEach } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { fireberry } from '../src/index';
import { aiListObjectFieldsAction } from '../src/lib/actions/ai/list-object-fields.action';
import { aiCreateRecordAction } from '../src/lib/actions/ai/create-record.action';
import { aiSearchRecordsAction } from '../src/lib/actions/ai/search-records.action';
import { aiUpdateRecordAction } from '../src/lib/actions/ai/update-record.action';
import { findRecordAction } from '../src/lib/actions/find-record.action';
import { updateRecordAction } from '../src/lib/actions/update-record.action';

afterEach(() => {
  vi.restoreAllMocks();
});

const auth = { type: 'SECRET_TEXT', secret_text: 'token' };

function ctx<T>(propsValue: T) {
  return { auth, propsValue };
}

describe('piece metadata', () => {
  it('has 4 human and 8 ai actions, all with outputSchema, and min release 0.86.4', () => {
    const actions = Object.values(fireberry.actions());
    expect(actions.filter((a) => a.audience === 'human')).toHaveLength(4);
    expect(actions.filter((a) => a.audience === 'ai')).toHaveLength(8);
    expect(actions.every((a) => a.outputSchema !== undefined)).toBe(true);
    expect(fireberry.minimumSupportedRelease).toBe('0.86.4');
  });
});

describe('ai actions', () => {
  it('accepts a numeric objectType and resolves it to the systemName', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { success: true, data: [{ name: 'Contact', systemName: 'Contact', objectType: 2 }] } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { success: true, data: [] } });
    const run = Reflect.get(aiListObjectFieldsAction, 'run');
    const result = await run(ctx({ objectSystemName: '2' }));
    expect(result.objectSystemName).toBe('Contact');
    expect(spy.mock.calls[1][0].url).toBe('https://api.fireberry.com/metadata/records/Contact/fields');
  });

  it('maps field type GUIDs to readable types', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({ status: 200, headers: {}, body: { success: true, data: [{ name: 'Account', systemName: 'Account', objectType: '1' }] } }).mockResolvedValue({
      status: 200,
      headers: {},
      body: { success: true, data: [{ label: 'Name', fieldName: 'accountname', systemFieldTypeId: 'a1e7ed6f-5083-477b-b44c-9943a6181359' }, { label: 'X', fieldName: 'x', systemFieldTypeId: 'nope' }] },
    });
    const run = Reflect.get(aiListObjectFieldsAction, 'run');
    const result = await run(ctx({ objectSystemName: 'Account' }));
    expect(result.fields.map((f: { type: string }) => f.type)).toEqual(['text', 'unknown']);
  });

  it('create posts to the single-record endpoint (no batch license needed) and returns the new id', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { success: true, data: [{ name: 'Account', systemName: 'Account', objectType: '1' }] } })
      .mockResolvedValue({ status: 200, headers: {}, body: { success: true, data: { Record: { accountid: 'g1', accountname: 'Acme' } } } });
    const run = Reflect.get(aiCreateRecordAction, 'run');
    const result = await run(ctx({ objectSystemName: 'Account', fields: { accountname: 'Acme' } }));
    expect(spy.mock.calls[1][0].url).toBe('https://api.fireberry.com/api/record/Account');
    expect(spy.mock.calls[1][0].body).toEqual({ accountname: 'Acme' });
    expect(result.id).toBe('g1');
  });

  it('update PUTs the fields then re-fetches the record', async () => {
    const meta = { status: 200, headers: {}, body: { success: true, data: [{ name: 'Account', systemName: 'Account', objectType: '1' }] } };
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(meta)
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { success: true, data: {} } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { success: true, data: { Record: { accountid: 'g1', telephone1: '1' } } } });
    const run = Reflect.get(aiUpdateRecordAction, 'run');
    const result = await run(ctx({ objectSystemName: 'Account', recordId: 'g1', fields: { telephone1: '1' } }));
    expect(spy.mock.calls[1][0]).toMatchObject({ method: 'PUT', url: 'https://api.fireberry.com/api/record/Account/g1', body: { telephone1: '1' } });
    expect(result).toEqual({ id: 'g1', objectSystemName: 'Account', record: { accountid: 'g1', telephone1: '1' } });
  });

  it('update still succeeds with an empty record when the re-fetch fails', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { success: true, data: [{ name: 'Account', systemName: 'Account', objectType: '1' }] } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { success: true } })
      .mockResolvedValue({ status: 404, headers: {}, body: { Message: 'gone' } });
    const run = Reflect.get(aiUpdateRecordAction, 'run');
    await expect(run(ctx({ objectSystemName: 'Account', recordId: 'g1', fields: { telephone1: '1' } }))).resolves.toEqual({ id: 'g1', objectSystemName: 'Account', record: {} });
  });

  it('create rejects non-object fields', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { success: true, data: [{ name: 'Account', systemName: 'Account', objectType: '1' }] } });
    const run = Reflect.get(aiCreateRecordAction, 'run');
    await expect(run(ctx({ objectSystemName: 'Account', fields: '[1]' }))).rejects.toThrow('JSON object');
  });

  it('search resolves objecttype and returns records without raw columns', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { success: true, data: [{ name: 'Contact', systemName: 'Contact', objectType: '2' }] } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { success: true, data: { PrimaryKey: 'contactid', PrimaryField: 'fullname', PageNum: 1, IsLastPage: true, Columns: [{}], Data: [{ contactid: 'c1' }] } } });
    const run = Reflect.get(aiSearchRecordsAction, 'run');
    const result = await run(ctx({ objectSystemName: 'contact', query: "(emailaddress1 = 'a@b.com')" }));
    expect(result).toEqual({ records: [{ contactid: 'c1' }], recordCount: 1, pageNumber: 1, isLastPage: true, primaryKey: 'contactid', primaryField: 'fullname' });
  });
});

describe('builder actions keep 0.1.8 behaviour', () => {
  function mockFireberry() {
    return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (request.url.endsWith('/metadata/records')) {
        return { status: 200, headers: {}, body: { success: true, data: [{ name: 'Account', systemName: 'Account', objectType: '1' }] } };
      }
      if (request.url.endsWith('/api/query')) {
        return { status: 200, headers: {}, body: { success: true, data: { PrimaryKey: 'accountid', IsLastPage: true, Data: [] } } };
      }
      return { status: 200, headers: {}, body: { success: true, data: { Record: { accountid: 'g1', accountname: 'Acme' } } } };
    });
  }

  it('Find Records clamps Page Size to 50 and Page Number to 10 instead of failing', async () => {
    const spy = mockFireberry();
    const run = Reflect.get(findRecordAction, 'run');
    const result = await run(ctx({ objectType: 'Account', pageSize: 100, pageNumber: 25, fieldsToReturn: {} }));
    expect(result.query).toMatchObject({ page_size: 50, page_number: 10 });
    const queryCall = spy.mock.calls.find(([request]) => request.url.endsWith('/api/query'));
    expect(queryCall?.[0].body).toMatchObject({ page_size: 50, page_number: 10 });
  });

  it('Update Record with every field empty succeeds without sending an update and returns the record', async () => {
    const spy = mockFireberry();
    const run = Reflect.get(updateRecordAction, 'run');
    const result = await run(ctx({ objectType: 'Account', recordId: 'g1', fields: { accountname: '', telephone1: null } }));
    expect(result).toEqual({ id: 'g1', objectSystemName: 'Account', record: { accountid: 'g1', accountname: 'Acme' } });
    expect(spy.mock.calls.some(([request]) => request.method === 'PUT')).toBe(false);
  });
});
