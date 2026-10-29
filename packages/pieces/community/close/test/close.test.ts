import crypto from 'crypto';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { close } from '../src';
import { closeAuth } from '../src/lib/auth';
import { CloseApiError, closeClient } from '../src/lib/common/client';
import { closeMappers } from '../src/lib/common/mappers';
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { verifySignature } from '../src/lib/triggers/helpers';

const auth = { secret_text: 'api_secret' };

function ok(body: unknown) {
  return { status: 200, headers: {}, body };
}

function httpFailure({ status, body }: { status: number; body: unknown }) {
  return Object.assign(new Error('http'), { response: { status, body, headers: {} } });
}

function mockSeq(...bodies: unknown[]) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const b of bodies) {
    if (b instanceof Error) spy.mockRejectedValueOnce(b);
    else spy.mockResolvedValueOnce(ok(b));
  }
  return spy;
}

function action(name: string) {
  const found = close.actions()[name];
  if (!found) throw new Error(`missing ${name}`);
  return found;
}

function run({ name, propsValue = {} }: { name: string; propsValue?: Record<string, unknown> }) {
  return Reflect.apply(action(name).run, undefined, [{ auth, propsValue }]);
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('metadata', () => {
  it('ai actions have outputSchema, aiMetadata and no dropdowns', () => {
    for (const a of Object.values(close.actions())) {
      if (a.audience !== 'ai') continue;
      expect(a.outputSchema, a.name).toBeDefined();
      expect(a.aiMetadata?.description, a.name).toBeTruthy();
      for (const p of Object.values(a.props)) {
        expect(['DROPDOWN', 'MULTI_SELECT_DROPDOWN', 'DYNAMIC']).not.toContain(Reflect.get(p, 'type'));
      }
    }
  });
  it('every action and trigger declares a non-empty outputSchema (except the generated custom API call)', () => {
    const actions = Object.values(close.actions()).filter((a) => a.name !== 'custom_api_call');
    const items = [...actions, ...Object.values(close.triggers())];
    expect(actions.length).toBe(Object.keys(close.actions()).length - 1);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.outputSchema?.fields?.length, item.name).toBeGreaterThan(0);
    }
  });

  it('legacy actions are human only', () => {
    for (const name of ['create_lead', 'create_contact', 'create_opportunity', 'find_lead', 'find_contact']) {
      expect(action(name).audience, name).toBe('human');
    }
  });
  it('no two ai actions share a name', () => {
    const names = Object.values(close.actions()).map((a) => a.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('client', () => {
  it('sends basic auth to the Close API with query params', async () => {
    const spy = mockSeq({ id: 'user_1' });
    await closeClient.request({ auth, method: HttpMethod.GET, path: '/me/', query: { _fields: 'id', skip: undefined } });
    const req = spy.mock.calls[0][0];
    expect(req.url).toBe('https://api.close.com/api/v1/me/');
    expect(req.authentication).toEqual({ type: 'BASIC', username: 'api_secret', password: '' });
    expect(req.queryParams).toEqual({ _fields: 'id' });
    expect(req.followRedirects).toBe(false);
  });
  it('accepts a plain string key and rejects an empty one', async () => {
    mockSeq({});
    await closeClient.request({ auth: '  k  ', method: HttpMethod.GET, path: '/me/' });
    await expect(closeClient.request({ auth: ' ', method: HttpMethod.GET, path: '/me/' })).rejects.toThrow('no API key');
  });
  it('refuses absolute and traversal paths', async () => {
    const spy = mockSeq();
    await expect(closeClient.request({ auth, method: HttpMethod.GET, path: 'https://evil.io/x' })).rejects.toThrow();
    await expect(closeClient.request({ auth, method: HttpMethod.GET, path: '//evil.io/x' })).rejects.toThrow();
    await expect(closeClient.request({ auth, method: HttpMethod.GET, path: '/lead/../me/' })).rejects.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
  it('surfaces the Close error and field errors', async () => {
    mockSeq(httpFailure({ status: 400, body: { error: 'Invalid lead', 'field-errors': { name: 'required' } } }));
    const err = await closeClient.request({ auth, method: HttpMethod.POST, path: '/lead/', body: {} }).catch((e) => e);
    expect(err).toBeInstanceOf(CloseApiError);
    expect(err.status).toBe(400);
    expect(err.message).toContain('Invalid lead');
    expect(err.message).toContain('name: required');
  });
  it('retries 429 with capped rate_reset wait, then succeeds', async () => {
    vi.useFakeTimers();
    const spy = mockSeq(httpFailure({ status: 429, body: { error: { rate_reset: 9999, message: 'slow down' } } }), { ok: true });
    const promise = closeClient.request({ auth, method: HttpMethod.GET, path: '/me/' });
    await vi.advanceTimersByTimeAsync(30_000);
    await expect(promise).resolves.toEqual({ ok: true });
    expect(spy).toHaveBeenCalledTimes(2);
  });
  it('gives up after two 429 retries', async () => {
    vi.useFakeTimers();
    const limited = () => httpFailure({ status: 429, body: { rate_reset: 0.1 } });
    mockSeq(limited(), limited(), limited());
    const promise = closeClient.request({ auth, method: HttpMethod.GET, path: '/me/' }).catch((e) => e);
    await vi.advanceTimersByTimeAsync(1000);
    const err = await promise;
    expect(err).toBeInstanceOf(CloseApiError);
    expect(err.status).toBe(429);
  });
  it('listPage passes _skip/_limit and reports nextSkip', async () => {
    const spy = mockSeq({ data: [{ id: 'a' }, { id: 'b' }], has_more: true });
    const page = await closeClient.listPage({ auth, path: '/lead/', limit: 500, skip: 10 });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ _limit: '100', _skip: '10' });
    expect(page).toEqual({ items: [{ id: 'a' }, { id: 'b' }], hasMore: true, nextSkip: 12 });
  });
  it('listAll stops at maxItems and reports truncation', async () => {
    mockSeq({ data: [{ id: 1 }, { id: 2 }], has_more: true }, { data: [{ id: 3 }], has_more: true });
    const all = await closeClient.listAll({ auth, path: '/lead/', maxItems: 3 });
    expect(all).toEqual({ items: [{ id: 1 }, { id: 2 }, { id: 3 }], truncated: true });
    const again = await (async () => {
      mockSeq({ data: [{ id: 1 }], has_more: false });
      return closeClient.listAll({ auth, path: '/lead/' });
    })();
    expect(again.truncated).toBe(false);
  });
  it('searchPage posts the query with cursor and fields', async () => {
    const spy = mockSeq({ data: [{ id: 'lead_1' }], cursor: 'c2' });
    const page = await closeClient.searchPage({ auth, query: { type: 'and', queries: [] }, fields: { lead: ['id'] }, cursor: 'c1', limit: 5 });
    expect(spy.mock.calls[0][0].body).toEqual({ query: { type: 'and', queries: [] }, _limit: 5, cursor: 'c1', _fields: { lead: ['id'] } });
    expect(page).toEqual({ items: [{ id: 'lead_1' }], hasMore: true, nextCursor: 'c2' });
  });
  it('validates inputs', () => {
    expect(closeClient.closeId({ value: ' lead_abc ', label: 'Lead ID', prefix: 'lead' })).toBe('lead_abc');
    expect(() => closeClient.closeId({ value: 'cont_abc', label: 'Lead ID', prefix: 'lead' })).toThrow('lead_');
    expect(() => closeClient.closeId({ value: 'lead/../x', label: 'Lead ID' })).toThrow();
    expect(closeClient.parseInteger({ value: '50', label: 'C', min: 0, max: 100 })).toBe(50);
    expect(() => closeClient.parseInteger({ value: 101, label: 'C', min: 0, max: 100 })).toThrow();
    expect(closeClient.parseBoolean({ value: ['true'], label: 'B' })).toBe(true);
    expect(closeClient.customFieldsBody({ value: '{"cf_abc":1,"custom.cf_def":"x"}' })).toEqual({ 'custom.cf_abc': 1, 'custom.cf_def': 'x' });
    expect(() => closeClient.customFieldsBody({ value: { name: 'x' } })).toThrow('cf_');
    expect(closeClient.isoDate({ value: '2026-10-18', label: 'D' })).toBe('2026-10-18');
  });
});

describe('mappers', () => {
  it('maps a lead with custom fields and contacts', () => {
    const lead = closeMappers.lead({
      id: 'lead_1',
      display_name: 'Acme',
      'custom.cf_x': 'y',
      contacts: [{ id: 'cont_1', name: 'Jo', emails: [{ email: 'jo@a.co', type: 'office' }] }],
    });
    expect(lead.name).toBe('Acme');
    expect(lead.custom).toEqual({ cf_x: 'y' });
    expect(lead.contacts[0].primaryEmail).toBe('jo@a.co');
    expect(lead.appUrl).toBe('https://app.close.com/lead/lead_1/');
  });
  it('keeps opportunity value in cents', () => {
    expect(closeMappers.opportunity({ id: 'oppo_1', value: 340000 }).valueCents).toBe(340000);
  });
});

describe('auth', () => {
  const validate = (key: string) => Reflect.apply(closeAuth.validate!, undefined, [{ auth: key }]);
  it('calls GET /me/', async () => {
    const spy = mockSeq({ id: 'user_1' });
    await expect(validate('k')).resolves.toEqual({ valid: true });
    expect(spy.mock.calls[0][0].url).toBe('https://api.close.com/api/v1/me/');
  });
  it('says invalid credentials only on 401', async () => {
    mockSeq(httpFailure({ status: 401, body: { error: 'Unauthorized' } }));
    expect((await validate('k')).error).toContain('Invalid credentials');
    mockSeq(httpFailure({ status: 500, body: 'boom' }));
    expect((await validate('k')).error).not.toContain('Invalid credentials');
  });
});

describe('webhook triggers', () => {
  const key = crypto.randomBytes(32).toString('hex');
  const sign = ({ ts, body }: { ts: string; body: string }) => crypto.createHmac('sha256', Buffer.from(key, 'hex')).update(ts + body).digest('hex');

  it('verifies signatures', () => {
    const body = '{"a":1}';
    expect(verifySignature({ signatureKey: key, timestamp: '123', rawBody: body, signatureHash: sign({ ts: '123', body: body }) })).toBe(true);
    expect(verifySignature({ signatureKey: key, timestamp: '123', rawBody: body, signatureHash: sign({ ts: '124', body: body }) })).toBe(false);
    expect(verifySignature({ signatureKey: key, timestamp: '123', rawBody: body, signatureHash: 'zz' })).toBe(false);
  });

  function makeStore(initial: Record<string, unknown> = {}) {
    const data: Record<string, unknown> = { ...initial };
    return {
      data,
      get: async (k: string) => data[k],
      put: async (k: string, v: unknown) => {
        data[k] = v;
      },
      delete: async (k: string) => {
        delete data[k];
      },
    };
  }

  it('fetches the record once per event id', async () => {
    const trigger = close.triggers()['new_lead_created'];
    const store = makeStore({ 'new-lead-trigger': { id: 'whsub_1', signatureKey: key } });
    const body = { event: { id: 'ev_1', object_type: 'lead', action: 'created', object_id: 'lead_1', data: { id: 'lead_1' } } };
    const raw = JSON.stringify(body);
    const payload = { body, rawBody: raw, headers: { 'close-sig-timestamp': '1', 'close-sig-hash': sign({ ts: '1', body: raw }) } };
    const spy = mockSeq({ id: 'lead_1' });
    const first = await Reflect.apply(trigger.run, undefined, [{ auth, store, payload }]);
    expect(first).toEqual([{ id: 'lead_1', [DEDUPE_KEY_PROPERTY]: 'close:lead:ev_1' }]);
    expect(store.data['new-lead-trigger-seen:ev_1']).toBe(true);
    expect(spy.mock.calls[0][0].url).toBe('https://api.close.com/api/v1/lead/lead_1/');
    const second = await Reflect.apply(trigger.run, undefined, [{ auth, store, payload }]);
    expect(second).toEqual([]);
  });

  function delivery({ eventId, objectType, objectId }: { eventId: string; objectType: string; objectId: string }) {
    const body = { event: { id: eventId, object_type: objectType, action: 'created', object_id: objectId } };
    const raw = JSON.stringify(body);
    return { body, rawBody: raw, headers: { 'close-sig-timestamp': '1', 'close-sig-hash': sign({ ts: '1', body: raw }) } };
  }

  it('overlapping deliveries of different events keep both seen markers', async () => {
    const trigger = close.triggers()['new_lead_created'];
    const store = makeStore({ 'new-lead-trigger': { id: 'whsub_1', signatureKey: key } });
    mockSeq({ id: 'lead_1' }, { id: 'lead_2' });
    await Promise.all([
      Reflect.apply(trigger.run, undefined, [{ auth, store, payload: delivery({ eventId: 'ev_a', objectType: 'lead', objectId: 'lead_1' }) }]),
      Reflect.apply(trigger.run, undefined, [{ auth, store, payload: delivery({ eventId: 'ev_b', objectType: 'lead', objectId: 'lead_2' }) }]),
    ]);
    expect(store.data['new-lead-trigger-seen:ev_a']).toBe(true);
    expect(store.data['new-lead-trigger-seen:ev_b']).toBe(true);
    const retry = await Reflect.apply(trigger.run, undefined, [{ auth, store, payload: delivery({ eventId: 'ev_a', objectType: 'lead', objectId: 'lead_1' }) }]);
    expect(retry).toEqual([]);
  });

  it('a retry is still ignored after more than 200 newer events', async () => {
    const trigger = close.triggers()['new_lead_created'];
    const store = makeStore({ 'new-lead-trigger': { id: 'whsub_1', signatureKey: key } });
    mockSeq(...Array.from({ length: 202 }, (_, i) => ({ id: `lead_${i}` })));
    for (let i = 0; i < 202; i++) {
      await Reflect.apply(trigger.run, undefined, [{ auth, store, payload: delivery({ eventId: `ev_${i}`, objectType: 'lead', objectId: `lead_${i}` }) }]);
    }
    const retry = await Reflect.apply(trigger.run, undefined, [{ auth, store, payload: delivery({ eventId: 'ev_0', objectType: 'lead', objectId: 'lead_0' }) }]);
    expect(retry).toEqual([]);
  });

  it('drops event markers older than the retry window and clears them on disable', async () => {
    const trigger = close.triggers()['new_lead_created'];
    const hour = Math.floor(Date.now() / 3600000);
    const store = makeStore({
      'new-lead-trigger': { id: 'whsub_1', signatureKey: key },
      'new-lead-trigger-seen:ev_old': true,
      [`new-lead-trigger-seen-hour:${hour - 74}`]: ['ev_old'],
      'new-lead-trigger-seen-hours': [hour - 74],
    });
    mockSeq({ id: 'lead_1' });
    await Reflect.apply(trigger.run, undefined, [{ auth, store, payload: delivery({ eventId: 'ev_new', objectType: 'lead', objectId: 'lead_1' }) }]);
    expect(store.data['new-lead-trigger-seen:ev_old']).toBeUndefined();
    expect(store.data[`new-lead-trigger-seen-hour:${hour - 74}`]).toBeUndefined();
    expect(store.data['new-lead-trigger-seen:ev_new']).toBe(true);
    expect(store.data[`new-lead-trigger-seen-hour:${hour}`]).toEqual(['ev_new']);
    expect(store.data['new-lead-trigger-seen-hours']).toEqual([hour]);
    mockSeq({});
    await Reflect.apply(trigger.onDisable, undefined, [{ auth, store }]);
    expect(Object.keys(store.data).filter((k) => k.includes('-seen'))).toEqual([]);
  });

  it('onDisable clears buckets left by a trigger that went quiet long ago', async () => {
    const trigger = close.triggers()['new_lead_created'];
    const hour = Math.floor(Date.now() / 3600000);
    const store = makeStore({
      'new-lead-trigger': { id: 'whsub_1', signatureKey: key },
      'new-lead-trigger-seen:ev_q': true,
      [`new-lead-trigger-seen-hour:${hour - 500}`]: ['ev_q'],
      'new-lead-trigger-seen-hours': [hour - 500],
    });
    const get = vi.fn(store.get);
    store.get = get;
    mockSeq({});
    await Reflect.apply(trigger.onDisable, undefined, [{ auth, store }]);
    expect(Object.keys(store.data).filter((k) => k.includes('-seen'))).toEqual([]);
    expect(get.mock.calls.length).toBeLessThan(5);
  });

  it('a failing index write does not block the run', async () => {
    const trigger = close.triggers()['new_lead_created'];
    const store = makeStore({ 'new-lead-trigger': { id: 'whsub_1', signatureKey: key } });
    const put = store.put;
    store.put = async (k: string, v: unknown) => {
      if (k.includes('-seen-hour:')) throw new Error('value too large');
      await put(k, v);
    };
    mockSeq({ id: 'lead_1' });
    const out = await Reflect.apply(trigger.run, undefined, [{ auth, store, payload: delivery({ eventId: 'ev_x', objectType: 'lead', objectId: 'lead_1' }) }]);
    expect(out).toHaveLength(1);
    expect(store.data['new-lead-trigger-seen:ev_x']).toBe(true);
  });

  it('opportunity and contact records expose custom.cf_ values under custom', async () => {
    const trigger = close.triggers()['new_opportunity_added'];
    const store = makeStore({ 'new-opportunity-trigger': { id: 'whsub_1', signatureKey: key } });
    mockSeq({ id: 'oppo_1', 'custom.cf_abc': 'Gold' });
    const out = await Reflect.apply(trigger.run, undefined, [{ auth, store, payload: delivery({ eventId: 'ev_o', objectType: 'opportunity', objectId: 'oppo_1' }) }]);
    expect(out[0]['custom.cf_abc']).toBe('Gold');
    expect(out[0].custom).toEqual({ cf_abc: 'Gold' });
    const fields = (schema: unknown) => (Reflect.get(Object(schema), 'fields') ?? []).map((f: { key: string }) => f.key);
    expect(fields(trigger.outputSchema)).toContain('custom');
    expect(fields(close.triggers()['new_contact_added'].outputSchema)).toContain('custom');
    expect(closeMappers.withCustomMap({ objectType: 'contact', record: { id: 'cont_1', 'custom.cf_x': 1 } })).toEqual({ id: 'cont_1', 'custom.cf_x': 1, custom: { cf_x: 1 } });
  });

  it('update actions send an explicit empty string to clear text fields', async () => {
    const spy = mockSeq({ id: 'lead_1' }, { id: 'cont_1' }, { id: 'oppo_1' });
    await run({ name: 'update_lead', propsValue: { leadId: 'lead_1', description: '', url: '' } });
    await run({ name: 'update_contact', propsValue: { contactId: 'cont_1', title: '' } });
    await run({ name: 'update_opportunity', propsValue: { opportunityId: 'oppo_1', note: '' } });
    expect(spy.mock.calls[0][0].body).toEqual({ description: '', url: '' });
    expect(spy.mock.calls[1][0].body).toEqual({ title: '' });
    expect(spy.mock.calls[2][0].body).toEqual({ note: '' });
    await expect(run({ name: 'update_lead', propsValue: { leadId: 'lead_1' } })).rejects.toThrow('Pass at least one field');
  });

  it('onDisable treats 404 as deleted and keeps state on other errors', async () => {
    const trigger = close.triggers()['new_contact_added'];
    const store = makeStore({ 'new-contact-trigger': { id: 'whsub_1', signatureKey: key } });
    mockSeq(httpFailure({ status: 500, body: 'x' }));
    await expect(Reflect.apply(trigger.onDisable, undefined, [{ auth, store }])).rejects.toThrow();
    expect(store.data['new-contact-trigger']).toBeDefined();
    const spy = mockSeq(httpFailure({ status: 404, body: {} }));
    await Reflect.apply(trigger.onDisable, undefined, [{ auth, store }]);
    expect(spy.mock.calls[0][0].url).toBe('https://api.close.com/api/v1/webhook/whsub_1/');
    expect(store.data['new-contact-trigger']).toBeUndefined();
  });

  it('onEnable deletes the webhook when the store write fails', async () => {
    const trigger = close.triggers()['new_opportunity_added'];
    const store = { ...makeStore(), put: async () => { throw new Error('store down'); } };
    const spy = mockSeq({ id: 'whsub_9', signature_key: key }, {});
    await expect(Reflect.apply(trigger.onEnable, undefined, [{ auth, store, webhookUrl: 'https://hook' }])).rejects.toThrow('store down');
    expect(spy.mock.calls[0][0].body).toEqual({ url: 'https://hook', events: [{ object_type: 'opportunity', action: 'created' }] });
    expect(spy.mock.calls[1][0].method).toBe(HttpMethod.DELETE);
  });
});

describe('legacy actions', () => {
  it('find_contact by lead id uses a reference condition', async () => {
    const spy = mockSeq({ data: [{ id: 'cont_1' }], cursor: null });
    const out = await run({ name: 'find_contact', propsValue: { search_type: 'lead_id', search_query: 'lead_1', match_type: 'exact' } });
    expect(out.found).toBe(true);
    const cond = spy.mock.calls[0][0].body.query.queries[1].condition;
    expect(cond).toEqual({ type: 'reference', reference_type: 'lead', object_ids: ['lead_1'] });
  });
  it('find_lead applies the exact match mode', async () => {
    const spy = mockSeq({ data: [], cursor: null });
    await run({ name: 'find_lead', propsValue: { search_type: 'name', search_query: 'Acme Inc', match_type: 'exact' } });
    expect(spy.mock.calls[0][0].body.query.queries[1].condition.mode).toBe('phrase');
  });
  it.each([
    ['find_contact', 'email', 'jo@acme.com'],
    ['find_contact', 'phone', '+15550100'],
    ['find_lead', 'contact_email', 'jo@acme.com'],
  ])('%s by %s keeps phrase matching on the default match type', async (name, search_type, search_query) => {
    const spy = mockSeq({ data: [], cursor: null });
    await run({ name, propsValue: { search_type, search_query, match_type: 'contains' } });
    const body = JSON.stringify(spy.mock.calls[0][0].body);
    expect(body).toContain('"mode":"phrase"');
    expect(body).not.toContain('full_words');
  });
  it('find_lead by status resolves an exact label to a status reference', async () => {
    const statuses = { data: [{ id: 'stat_pot', label: 'Potential' }, { id: 'stat_bad', label: 'Bad Fit' }] };
    const spy = mockSeq(statuses, { data: [{ id: 'lead_1' }], cursor: null });
    const out = await run({ name: 'find_lead', propsValue: { search_type: 'status', search_query: 'Potential', match_type: 'exact' } });
    expect(out.found).toBe(true);
    expect(spy.mock.calls[0][0].url).toContain('/status/lead/');
    expect(spy.mock.calls[1][0].body.query.queries[1].condition).toEqual({ type: 'reference', reference_type: 'status.lead', object_ids: ['stat_pot'] });
  });
  it('find_lead by status contains matches label substrings case-insensitively', async () => {
    const statuses = { data: [{ id: 'stat_pot', label: 'Potential' }, { id: 'stat_pot2', label: 'Very Potential' }, { id: 'stat_bad', label: 'Bad Fit' }] };
    const spy = mockSeq(statuses, { data: [], cursor: null });
    await run({ name: 'find_lead', propsValue: { search_type: 'status', search_query: 'potent', match_type: 'contains' } });
    expect(spy.mock.calls[1][0].body.query.queries[1].condition.object_ids).toEqual(['stat_pot', 'stat_pot2']);
  });
  it('find_lead by status returns found false without searching when no label matches', async () => {
    const spy = mockSeq({ data: [{ id: 'stat_pot', label: 'Potential' }] });
    const out = await run({ name: 'find_lead', propsValue: { search_type: 'status', search_query: 'Nope', match_type: 'exact' } });
    expect(out).toEqual({ found: false, result: [] });
    expect(spy).toHaveBeenCalledTimes(1);
  });
  it('create_opportunity rejects confidence above 100 before calling Close', async () => {
    const spy = mockSeq();
    await expect(run({ name: 'create_opportunity', propsValue: { lead_id: 'lead_1', status_id: 'stat_1', confidence: 150 } })).rejects.toThrow('Confidence');
    expect(spy).not.toHaveBeenCalled();
  });
});
