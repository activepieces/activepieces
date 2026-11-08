import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient, HttpError } from '@activepieces/pieces-common';
import { getBiginConnection, biginApiService, BiginApiError, assertWriteSucceeded } from '../src/lib/common/request';
import { escapeCriteriaValue, formatDateOnly } from '../src/lib/common/helpers';
import { biginRecords } from '../src/lib/common/records';
import { usersDropdown } from '../src/lib/common/props';
import { biginAuth } from '../src/lib/auth';
import { searchContactRecord } from '../src/lib/actions/search-contact-record';
import { createCompany } from '../src/lib/actions/create-company';
import { newContactCreated } from '../src/lib/triggers/new-contact-created';
import { ZOHO_WEBHOOK_TOKEN } from '../src/lib/common/constants';

const auth = {
  access_token: 'tok',
  data: { api_domain: 'https://www.zohoapis.eu' },
  props: { domain: 'https://accounts.zoho.com' },
};

function mockResponse({ status, body }: { status: number; body: unknown }) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status, body, headers: {} });
}

function makeStore(initial: Record<string, unknown> = {}) {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    get: async (k: string) => data.get(k) ?? null,
    put: async (k: string, v: unknown) => {
      data.set(k, v);
      return v;
    },
    delete: async (k: string) => {
      data.delete(k);
    },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('request wrapper', () => {
  it('returns {} on 204 with empty body', async () => {
    mockResponse({ status: 204, body: '' });
    const res = await biginApiService.searchRecords('tok', 'https://x', 'Contacts', { key: 'word', value: 'a' });
    expect(res).toEqual({});
  });

  it('maps HttpError to BiginApiError with status and Zoho code', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 400, responseBody: { code: 'INVALID_QUERY', message: 'Invalid query formed' } }),
    );
    const err = await biginApiService.fetchModules('tok', 'https://x').catch((e) => e);
    expect(err).toBeInstanceOf(BiginApiError);
    expect(err.status).toBe(400);
    expect(err.code).toBe('INVALID_QUERY');
    expect(err.message).toContain('Invalid query formed');
    expect(err).not.toHaveProperty('body');
  });

  it('legacy search returns data: [] on 204', async () => {
    mockResponse({ status: 204, body: '' });
    const out = await searchContactRecord.run({
      auth,
      propsValue: { mode: 'word', searchTerm: 'zzqxnomatch' },
    } as never);
    expect(out).toEqual({ message: 'Contact record search completed successfully', data: [] });
  });
});

describe('escapeCriteriaValue', () => {
  it('escapes parentheses, commas and backslashes', () => {
    expect(escapeCriteriaValue('a(b),c\\d')).toBe('a\\(b\\)\\,c\\\\d');
    expect(escapeCriteriaValue('plain')).toBe('plain');
  });
});

describe('api_domain resolution', () => {
  it('getBiginConnection reads auth.data.api_domain', () => {
    expect(getBiginConnection(auth)).toEqual({ accessToken: 'tok', apiDomain: 'https://www.zohoapis.eu' });
  });

  it('usersDropdown calls the token api_domain', async () => {
    const spy = mockResponse({ status: 200, body: { users: [{ id: '1', full_name: 'Jane' }], info: { more_records: false } } });
    const res = await usersDropdown.options({ auth } as never, {} as never);
    expect(spy.mock.calls[0][0].url.startsWith('https://www.zohoapis.eu/bigin/v2/users')).toBe(true);
    expect(res.options).toEqual([{ label: 'Jane', value: '1' }]);
  });

  it('validate uses auth.data.api_domain, not the region prop', async () => {
    const spy = mockResponse({ status: 200, body: { modules: [] } });
    const res = await biginAuth.validate!({ auth } as never);
    expect(res).toEqual({ valid: true });
    expect(spy.mock.calls[0][0].url).toBe('https://www.zohoapis.eu/bigin/v2/settings/modules');
  });
});

describe('webhook triggers', () => {
  const key = 'bigin_created_contact_trigger';

  it('rejects a payload with the wrong token', async () => {
    const store = makeStore({ [key]: { channel_id: '1', token: 'secret' } });
    await expect(
      newContactCreated.run({ auth, store, payload: { body: { token: 'nope', ids: [] } } } as never),
    ).rejects.toThrow('Invalid webhook token');
  });

  it('accepts the legacy constant token when the store holds a plain channel id', async () => {
    const store = makeStore({ [key]: '12345' });
    mockResponse({ status: 200, body: { data: [{ id: '9', Last_Name: 'X' }] } });
    const out = await newContactCreated.run({
      auth,
      store,
      payload: { body: { token: ZOHO_WEBHOOK_TOKEN, ids: ['9'], module: 'Contacts' } },
    } as never);
    expect(out).toEqual([{ ids: ['9'], module: 'Contacts', records: [{ id: '9', Last_Name: 'X' }] }]);
  });

  it('still returns the notification when the record read fails', async () => {
    const store = makeStore({ [key]: { channel_id: '1', token: 'secret' } });
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('rate limited'));
    const out = await newContactCreated.run({
      auth,
      store,
      payload: { body: { token: 'secret', ids: ['9'], module: 'Contacts', operation: 'insert' } },
    } as never);
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ ids: ['9'], module: 'Contacts', operation: 'insert', records: [] });
    expect(out[0]).toHaveProperty('records_error');
    expect(out[0]).not.toHaveProperty('token');
  });

  it('onEnable sends channel_expiry and stores a random token', async () => {
    const store = makeStore();
    const spy = mockResponse({ status: 200, body: { watch: [] } });
    await newContactCreated.onEnable({ auth, store, webhookUrl: 'https://hook' } as never);
    const watch = spy.mock.calls[0][0].body.watch[0];
    expect(watch.events).toEqual(['Contacts.create']);
    expect(typeof watch.channel_expiry).toBe('string');
    const stored = store.data.get(key);
    expect(stored).toMatchObject({ channel_id: watch.channel_id, token: watch.token });
    expect(watch.token).not.toBe(ZOHO_WEBHOOK_TOKEN);
  });

  it('onEnable throws when Bigin rejects the subscription', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 400, responseBody: { code: 'INVALID_URL', message: 'bad url' } }),
    );
    await expect(
      newContactCreated.onEnable({ auth, store: makeStore(), webhookUrl: 'x' } as never),
    ).rejects.toThrow('INVALID_URL');
  });

  it('onRenew PATCHes a new expiry about 23h ahead', async () => {
    const store = makeStore({ [key]: { channel_id: '1', token: 'secret' } });
    const spy = mockResponse({ status: 200, body: { watch: [] } });
    const before = Date.now();
    await newContactCreated.onRenew!({ auth, store, webhookUrl: 'https://hook' } as never);
    const req = spy.mock.calls[0][0];
    expect(req.method).toBe('PATCH');
    const watch = req.body.watch[0];
    expect(watch).toMatchObject({ channel_id: '1', token: 'secret', events: ['Contacts.create'] });
    const delta = new Date(watch.channel_expiry).getTime() - before;
    expect(delta).toBeGreaterThan(22 * 3600 * 1000);
    expect(delta).toBeLessThan(24 * 3600 * 1000);
  });
});

describe('per-record write errors', () => {
  it('assertWriteSucceeded throws on status error', () => {
    expect(() =>
      assertWriteSucceeded({ status: 'error', code: 'MANDATORY_NOT_FOUND', message: 'required field not found' }),
    ).toThrow('MANDATORY_NOT_FOUND');
    expect(() => assertWriteSucceeded({ status: 'success', details: { id: '1' } })).not.toThrow();
  });

  it('new records helper throws on a 202 with data[0].status error', async () => {
    mockResponse({ status: 202, body: { data: [{ status: 'error', code: 'INVALID_DATA', message: 'invalid data', details: {} }] } });
    await expect(
      biginRecords.create({ connection: getBiginConnection(auth), module: 'Contacts', record: { Last_Name: 'X' } }),
    ).rejects.toThrow('INVALID_DATA');
  });

  it('legacy createCompany throws on a 200 with data[0].status error', async () => {
    mockResponse({ status: 200, body: { data: [{ status: 'error', code: 'DUPLICATE_DATA', message: 'duplicate data', details: {} }] } });
    await expect(
      createCompany.run({ auth, propsValue: { accountName: 'Acme' } } as never),
    ).rejects.toThrow('DUPLICATE_DATA');
  });
});

describe('calls', () => {
  it('formatCallDuration converts minutes to mm:ss text', async () => {
    const { formatCallDuration } = await import('../src/lib/common/helpers');
    expect(formatCallDuration(5)).toBe('05:00');
    expect(formatCallDuration(1.5)).toBe('01:30');
    expect(formatCallDuration(125)).toBe('125:00');
    expect(formatCallDuration(0)).toBe('00:00');
  });

  it('formatDateTimeKeepOffset keeps the caller offset', async () => {
    const { formatDateTimeKeepOffset } = await import('../src/lib/common/helpers');
    expect(formatDateTimeKeepOffset('2026-11-01T09:00:00+03:00')).toBe('2026-11-01T09:00:00+03:00');
    expect(formatDateTimeKeepOffset('2026-11-01T09:00:00.000+03:00')).toBe('2026-11-01T09:00:00+03:00');
    expect(formatDateTimeKeepOffset('2026-11-01T06:00:00.000Z')).toBe('2026-11-01T06:00:00+00:00');
  });

  it('log_call sends Call_Duration as text and links the contact via Who_Id', async () => {
    const { biginLogCallAi } = await import('../src/lib/actions/ai/log-call');
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 201, headers: {}, body: { data: [{ status: 'success', details: { id: '7' } }] } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: [{ id: '7' }] } });
    await biginLogCallAi.run({
      auth,
      propsValue: {
        callStartTime: '2026-11-01T09:00:00+03:00',
        callDuration: 5,
        callType: 'Outbound',
        contactId: '42',
        relatedModule: 'Pipelines',
        relatedId: '99',
      },
    } as never);
    const sent = spy.mock.calls[0][0].body.data[0];
    expect(sent.Call_Duration).toBe('05:00');
    expect(sent.Call_Start_Time).toBe('2026-11-01T09:00:00+03:00');
    expect(sent.Who_Id).toEqual({ id: '42' });
    expect(sent.What_Id).toEqual({ id: '99' });
    expect(sent.$se_module).toBe('Deals');
    expect(sent).not.toHaveProperty('Contact_Name');
  });

  it('legacy createCall sends Call_Duration as text and Who_Id', async () => {
    const { createCall } = await import('../src/lib/actions/create-call');
    const spy = mockResponse({ status: 201, body: { data: [{ status: 'success', details: { id: '7' } }] } });
    await createCall.run({
      auth,
      propsValue: { callStartTime: '2026-11-01T09:00:00+03:00', callDuration: 30, callType: 'Inbound', contactName: '42' },
    } as never);
    const sent = spy.mock.calls[0][0].body.data[0];
    expect(sent.Call_Duration).toBe('30:00');
    expect(sent.Who_Id).toEqual({ id: '42' });
  });
});

describe('call start time', () => {
  it('rejects a future start time before sending', async () => {
    const { biginLogCallAi } = await import('../src/lib/actions/ai/log-call');
    const spy = vi.spyOn(httpClient, 'sendRequest');
    const future = new Date(Date.now() + 3600 * 1000).toISOString();
    await expect(
      biginLogCallAi.run({ auth, propsValue: { callStartTime: future, callDuration: 5, callType: 'Outbound' } } as never),
    ).rejects.toThrow('must be in the past');
    expect(spy).not.toHaveBeenCalled();
  });

  it('legacy createCall maps Pipelines to Deals and rejects future start', async () => {
    const { createCall } = await import('../src/lib/actions/create-call');
    const spy = mockResponse({ status: 201, body: { data: [{ status: 'success', details: { id: '7' } }] } });
    await createCall.run({
      auth,
      propsValue: { callStartTime: '2026-10-01T09:00:00+03:00', callDuration: 5, callType: 'Inbound', relatedModule: 'Pipelines', relatedTo: '99' },
    } as never);
    expect(spy.mock.calls[0][0].body.data[0].$se_module).toBe('Deals');
    const future = new Date(Date.now() + 3600 * 1000).toISOString();
    await expect(
      createCall.run({ auth, propsValue: { callStartTime: future, callDuration: 5, callType: 'Inbound' } } as never),
    ).rejects.toThrow('must be in the past');
  });
});

describe('tags dropdown', () => {
  it('surfaces the Zoho error message', async () => {
    const { tagsDropdown } = await import('../src/lib/common/props');
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({}, { status: 403, responseBody: { code: 'NOT_SUPPORTED_FEATURE', message: 'feature not supported' } }),
    );
    const res = await tagsDropdown('Calls').options({ auth } as never, {} as never);
    expect(res.placeholder).toContain('NOT_SUPPORTED_FEATURE');
  });
});

describe('deal links on AI tasks and events', () => {
  const ok = { status: 201, headers: {}, body: { data: [{ status: 'success', details: { id: '5' } }] } };
  const read = { status: 200, headers: {}, body: { data: [{ id: '5' }] } };
  it.each([
    ['create-task', 'biginCreateTaskAi', { subject: 'S' }],
    ['update-task', 'biginUpdateTaskAi', { recordId: '5' }],
    ['create-event', 'biginCreateEventAi', { title: 'E', start: '2026-11-02T09:00:00Z', end: '2026-11-02T10:00:00Z' }],
    ['update-event', 'biginUpdateEventAi', { recordId: '5' }],
  ])('%s sends $related_module Deals for Pipelines', async (file, name, extra) => {
    const mod = (await import(`../src/lib/actions/ai/${file}`)) as Record<string, { run: (c: unknown) => Promise<unknown> }>;
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(ok).mockResolvedValueOnce(read);
    await mod[name].run({ auth, propsValue: { ...extra, relatedModule: 'Pipelines', relatedId: '99' } } as never);
    const sent = spy.mock.calls[0][0].body.data[0];
    expect(sent.$related_module).toBe('Deals');
    expect(sent.Related_To ?? sent.What_Id).toEqual({ id: '99' });
  });
});

describe('records write read-back', () => {
  const connection = getBiginConnection(auth as never);
  it('create returns the confirmed write when the re-read fails', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 201, headers: {}, body: { data: [{ status: 'success', details: { id: '8', Created_Time: '2026-11-01T10:00:00+00:00' } }] } })
      .mockRejectedValueOnce(new Error('timeout'));
    const result = await biginRecords.create({ connection, module: 'Contacts', record: { Last_Name: 'X' } });
    expect(result.id).toBe('8');
    expect(result.created_time).toBe('2026-11-01T10:00:00+00:00');
    expect(result.record).toMatchObject({ id: '8' });
  });
  it('update returns the confirmed write when the re-read fails', async () => {
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: [{ status: 'success', details: { id: '8', Modified_Time: 'm' } }] } })
      .mockRejectedValueOnce(new Error('rate limited'));
    const result = await biginRecords.update({ connection, module: 'Contacts', id: '8', record: { Last_Name: 'Y' } });
    expect(result).toMatchObject({ id: '8', modified_time: 'm', record: { id: '8' } });
  });
});

describe('pipeline secondary contacts', () => {
  const okWrite = { status: 200, headers: {}, body: { data: [{ status: 'success', details: { id: '9' } }] } };
  const errWrite = { status: 202, headers: {}, body: { data: [{ status: 'error', code: 'INVALID_DATA', message: 'bad contact', details: {} }] } };
  it('update checks the main write before touching contacts', async () => {
    const { updatePipelineRecord } = await import('../src/lib/actions/update-pipeline-record');
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(errWrite).mockResolvedValueOnce(okWrite);
    await expect(
      updatePipelineRecord.run({ auth, propsValue: { pipelineRecordId: JSON.stringify({ id: '9' }), pipelineDetails: {}, secondaryContacts: ['2'] } } as never),
    ).rejects.toThrow();
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('update fails when the secondary-contacts write is rejected', async () => {
    const { updatePipelineRecord } = await import('../src/lib/actions/update-pipeline-record');
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(okWrite).mockResolvedValueOnce(errWrite);
    await expect(
      updatePipelineRecord.run({ auth, propsValue: { pipelineRecordId: JSON.stringify({ id: '9' }), pipelineDetails: {}, secondaryContacts: ['2'] } } as never),
    ).rejects.toThrow();
  });
  it('create fails when the secondary-contacts write is rejected', async () => {
    const { createPipelineRecord } = await import('../src/lib/actions/create-pipeline-record');
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({ ...okWrite, status: 201 }).mockResolvedValueOnce(errWrite);
    await expect(
      createPipelineRecord.run({ auth, propsValue: { pipelineDetails: { dealName: 'D' }, subPipeline: 'S', stage: 'Qualification', secondaryContacts: ['2'] } } as never),
    ).rejects.toThrow();
  });
});

describe('review follow-ups', () => {
  it('Update Contact (Agent) merges new tags with the existing ones', async () => {
    const { biginUpdateContactAi } = await import('../src/lib/actions/ai/update-contact');
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: [{ id: '8', Tag: [{ name: 'Lead', id: 't1' }, { name: 'vip', id: 't2' }] }] } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: [{ status: 'success', details: { id: '8', Modified_Time: 'm' } }] } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: [{ id: '8' }] } });
    await runWith({ fn: biginUpdateContactAi.run, context: { auth, propsValue: { recordId: ' 8 ', tags: ['VIP', 'Partner'] } } });
    expect(spy.mock.calls[0][0].method).toBe('GET');
    expect(spy.mock.calls[0][0].url).toContain('/Contacts/8');
    const put = spy.mock.calls[1][0];
    expect(put.method).toBe('PUT');
    expect(put.body.data[0].Tag).toEqual([{ name: 'Lead' }, { name: 'vip' }, { name: 'Partner' }]);
  });

  it('Update Company (Agent) skips the tag read when no tags are passed', async () => {
    const { biginUpdateCompanyAi } = await import('../src/lib/actions/ai/update-company');
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: [{ status: 'success', details: { id: '5', Modified_Time: 'm' } }] } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: [{ id: '5' }] } });
    await runWith({ fn: biginUpdateCompanyAi.run, context: { auth, propsValue: { recordId: '5', phone: '123' } } });
    expect(spy.mock.calls[0][0].method).toBe('PUT');
    expect(spy.mock.calls[0][0].body.data[0]).not.toHaveProperty('Tag');
  });

  it('legacy createCall sends no related record when Related To is empty', async () => {
    const { createCall } = await import('../src/lib/actions/create-call');
    const spy = mockResponse({ status: 201, body: { data: [{ status: 'success', details: { id: '7' } }] } });
    await runWith({
      fn: createCall.run,
      context: {
        auth,
        propsValue: { callStartTime: '2026-10-01T09:00:00+03:00', callDuration: 5, callType: 'Inbound', relatedModule: 'Pipelines', relatedTo: {} },
      },
    });
    const payload = spy.mock.calls[0][0].body.data[0];
    expect(payload).not.toHaveProperty('What_Id');
    expect(payload).not.toHaveProperty('$se_module');
  });

  it('renews the 23h channel every 6 hours', () => {
    expect(newContactCreated.renewConfiguration).toEqual({ strategy: 'CRON', cronExpression: '0 */6 * * *' });
  });

  it('keeps every notified id but fetches records for the first 10 only', async () => {
    const store = makeStore({ bigin_created_contact_trigger: { channel_id: '1', token: 'secret' } });
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => ({
      status: 200,
      headers: {},
      body: { data: [{ id: String(req.url).split('/').pop() }] },
    }));
    const ids = Array.from({ length: 12 }, (_, i) => String(i + 1));
    const out = await runWith({ fn: newContactCreated.run, context: { auth, store, payload: { body: { token: 'secret', ids, module: 'Contacts' } } } });
    expect(spy).toHaveBeenCalledTimes(10);
    expect(out).toEqual([expect.objectContaining({ ids, records: ids.slice(0, 10).map((id) => ({ id })) })]);
  });
});

function runWith({ fn, context }: { fn: unknown; context: Record<string, unknown> }): Promise<unknown> {
  if (typeof fn !== 'function') {
    throw new Error('not callable');
  }
  return Promise.resolve(Reflect.apply(fn, undefined, [context]));
}

describe('formatDateOnly', () => {
  it('keeps a date-only string as given, whatever the worker timezone', () => {
    const original = process.env['TZ'];
    process.env['TZ'] = 'America/New_York';
    try {
      expect(formatDateOnly('2026-11-10')).toBe('2026-11-10');
      expect(formatDateOnly(' 2026-01-01 ')).toBe('2026-01-01');
    } finally {
      process.env['TZ'] = original;
    }
  });

  it('takes the calendar date from an ISO date-time string', () => {
    expect(formatDateOnly('2026-11-10T00:00:00.000Z')).toBe('2026-11-10');
  });

  it('still formats a Date object', () => {
    expect(formatDateOnly(new Date(2026, 10, 10, 12))).toBe('2026-11-10');
  });
});
