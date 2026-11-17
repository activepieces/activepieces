import { createHmac } from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { village } from '../src/index';
import { villageApi } from '../src/lib/common/client';
import { enrichPerson } from '../src/lib/actions/people/enrich-person';
import { enrichCompanyBulk } from '../src/lib/actions/companies/enrich-company-bulk';
import { findPeople } from '../src/lib/actions/ai/find-people';
import { listNetworkPeople } from '../src/lib/actions/ai/list-network-people';
import { resolveListByName } from '../src/lib/actions/ai/resolve-list-by-name';
import { addLeadToSequence } from '../src/lib/actions/ai/add-lead-to-sequence';
import { createSequence } from '../src/lib/actions/sequences/create-sequence';
import { getSequence } from '../src/lib/actions/sequences/get-sequence';
import { newVillageEvent } from '../src/lib/triggers/new-village-event';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('villageApi.call error mapping', () => {
  it.each([
    [401, 'invalid or was revoked'],
    [402, 'not enough Village credits'],
    [404, 'not found'],
    [429, 'rate limited'],
  ])('maps %i to a clear message and keeps vendor detail in responseBody', async (status, text) => {
    const body = { error: { title: 'Vendor title', detail: 'Vendor detail' } };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status, responseBody: body }));
    const failure = await villageApi.call({ token: 't', method: HttpMethod.GET, path: '/v2/app' }).catch((error: unknown) => error);
    expect(failure).toBeInstanceOf(Error);
    expect(String(failure)).toContain(text);
    expect(String(failure)).toContain('Vendor detail');
    expect(Reflect.get(Object(failure), 'responseBody')).toEqual(body);
    expect(Reflect.get(Object(failure), 'body')).toBeUndefined();
  });

  it('warns a POST may have been applied on a network error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('socket hang up'));
    await expect(villageApi.call({ token: 't', method: HttpMethod.POST, path: '/v2/lists', body: {} })).rejects.toThrow(
      'may still have been applied',
    );
  });

  it('sends the bearer token and drops empty query params', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { data: [] } });
    await villageApi.call({ token: 'tok', method: HttpMethod.GET, path: '/v2/lists', queryParams: { a: 'x', b: undefined, c: '' } });
    const request = spy.mock.calls[0][0];
    expect(request.url).toBe('https://api.village.ai/v2/lists');
    expect(request.headers).toMatchObject({ Authorization: 'Bearer tok' });
    expect(request.queryParams).toEqual({ a: 'x' });
  });

  it('does not double-encode already-encoded IDs', () => {
    expect(villageApi.encodePathId('abc%3D%3D!vNnNM')).toBe(villageApi.encodePathId('abc==!vNnNM'));
  });
});

describe('enrich mode', () => {
  it('passes mode on Enrich Person', async () => {
    const spy = mockOk({ data: {} });
    await runStep({ step: enrichPerson, props: { linkedin_url: 'https://linkedin.com/in/x', mode: 'cached_only' } });
    expect(spy.mock.calls[0][0].body).toEqual({ linkedin_url: 'https://linkedin.com/in/x', mode: 'cached_only' });
  });

  it('omits mode when not set on Enrich Company (Bulk)', async () => {
    const spy = mockOk({ data: [] });
    await runStep({ step: enrichCompanyBulk, props: { identifiers: [{ identifierType: 'domain', identifierValue: 'stripe.com' }] } });
    expect(spy.mock.calls[0][0].body).not.toHaveProperty('mode');
  });
});

describe('ai actions', () => {
  it('Find People caps limit at 10 and returns flat rows', async () => {
    const spy = mockOk({
      data: [{ id: 7, full_name: 'Ada', headline: 'CTO', linkedin_url: 'https://linkedin.com/in/ada', work_relevant: { title: 'CTO', company: { name: 'Acme' } } }],
      pagination: { cursor: 'c2', has_next_page: true },
    });
    const output = await runStep({ step: findPeople, props: { prompt: 'ctos', limit: 50 } });
    expect(spy.mock.calls[0][0].body).toMatchObject({ prompt: 'ctos', limit: 10, scope: 'network' });
    expect(output).toEqual({
      people: [{ id: '7', name: 'Ada', headline: 'CTO', title: 'CTO', company: 'Acme', linkedin_url: 'https://linkedin.com/in/ada' }],
      found: true,
      next_cursor: 'c2',
      has_more: true,
      credits_used: null,
      credits_left: null,
    });
  });

  it('List Network People always asks for first degree only', async () => {
    const spy = mockOk({ data: [], pagination: { has_next_page: false } });
    await runStep({ step: listNetworkPeople, props: {} });
    expect(spy.mock.calls[0][0].body).toMatchObject({ connection_degrees: [1] });
  });

  it('Resolve List by Name follows pages and matches case-insensitively', async () => {
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: [{ id: 1, title: 'Leads old' }], pagination: { cursor: 'n', has_next_page: true } } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: [{ id: 2, title: 'LEADS' }], pagination: { has_next_page: false } } });
    const output = await runStep({ step: resolveListByName, props: { name: 'leads' } });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][0].queryParams).toMatchObject({ cursor: 'n', search: 'leads' });
    expect(output).toMatchObject({ found: true, id: '2', name: 'LEADS' });
  });

  it('Add Lead to Sequence reports a skipped lead', async () => {
    mockOk({ data: { added_leads: [], skipped_leads: [{ village_person_id: 5, reason: 'already_in_sequence' }] } });
    const output = await runStep({ step: addLeadToSequence, props: { sequence_id: 's!vNnNM', person_id: '5' } });
    expect(output).toMatchObject({ added: false, skipped_reason: 'already_in_sequence' });
  });

  it('encodes sequence IDs in the path', async () => {
    const spy = mockOk({ data: {} });
    await runStep({ step: getSequence, props: { id: 'ab==!vNnNM' } });
    expect(spy.mock.calls[0][0].url).toBe('https://api.village.ai/v2/sequences/ab%3D%3D!vNnNM');
  });
});

describe('create sequence defaults', () => {
  it('defaults to sales + cold so Village can build the required templates', async () => {
    const spy = mockOk({ data: { id: 's' } });
    await runStep({ step: createSequence, props: { name: 'x' } });
    expect(spy.mock.calls[0][0].body).toEqual({ name: 'x', use_case: 'sales', outreach_approach: 'cold' });
  });
});

describe('piece metadata', () => {
  it('has the planned audience split', () => {
    const counts = Object.values(village.actions()).reduce<Record<string, number>>((acc, action) => {
      const audience = action.audience ?? 'none';
      return { ...acc, [audience]: (acc[audience] ?? 0) + 1 };
    }, {});
    expect(counts).toEqual({ both: 44, human: 19, ai: 11 });
  });

  it('gives every action an outputSchema', () => {
    const missing = Object.values(village.actions())
      .filter((action) => action.outputSchema === undefined)
      .map((action) => action.name)
      .sort();
    expect(missing).toEqual([]);
  });

  it('requires an engine that hides ai-only actions', () => {
    expect(village.minimumSupportedRelease).toBe('0.86.4');
  });
});

describe('new village event trigger', () => {
  it('registers a signed webhook and stores its id and secret', async () => {
    const spy = mockOk({ data: { id: 'wh!vNnNM' } });
    const store = createStore();
    await Reflect.apply(newVillageEvent.onEnable, undefined, [
      { auth: { secret_text: 't' }, webhookUrl: 'https://hook.example/x', propsValue: { event_filter: ['job_change'] }, store },
    ]);
    const body = spy.mock.calls[0][0].body;
    expect(body).toMatchObject({ url: 'https://hook.example/x', event_filter: ['job_change'], is_active: true });
    const stored = await store.get('village_new_event_webhook');
    expect(stored).toMatchObject({ webhookId: 'wh!vNnNM', secret: Reflect.get(Object(body), 'secret') });
  });

  it('deletes the webhook on disable and treats 404 as already gone', async () => {
    const store = createStore();
    await store.put('village_new_event_webhook', { webhookId: 'wh', secret: 's' });
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 404, responseBody: {} }));
    await Reflect.apply(newVillageEvent.onDisable, undefined, [{ auth: { secret_text: 't' }, propsValue: {}, store }]);
    expect(await store.get('village_new_event_webhook')).toBeNull();
  });

  it('accepts a correctly signed delivery once and drops bad signatures and repeats', async () => {
    const store = createStore();
    const secret = 'a'.repeat(64);
    await store.put('village_new_event_webhook', { webhookId: 'wh', secret });
    const rawBody = JSON.stringify({ id: 'evt_1', type: 'job_change' });
    const signature = createHmac('sha256', secret).update(rawBody).digest('hex');
    const deliver = (sig: string) =>
      Reflect.apply(newVillageEvent.run, undefined, [
        { store, propsValue: {}, auth: { secret_text: 't' }, payload: { headers: { 'X-Village-Signature': sig }, rawBody, body: JSON.parse(rawBody) } },
      ]);
    expect(await deliver('deadbeef')).toEqual([]);
    expect(await deliver(signature)).toEqual([{ id: 'evt_1', type: 'job_change' }]);
    expect(await deliver(`sha256=${signature}`)).toEqual([]);
  });
});

describe('trigger delivery dedupe', () => {
  it('dedupes on the x-village-delivery header even when bodies have no id', async () => {
    const store = createStore();
    const secret = 'c'.repeat(64);
    await store.put('village_new_event_webhook', { webhookId: 'wh', secret });
    const deliver = ({ delivery, timestamp }: { delivery: string; timestamp: string }) => {
      const rawBody = JSON.stringify({ event: 'list_added', timestamp, user_id: 1, webhook_id: 13, data: { list_id: 1 } });
      const signature = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`;
      return Reflect.apply(newVillageEvent.run, undefined, [
        {
          store,
          propsValue: {},
          auth: { secret_text: 't' },
          payload: { headers: { 'x-village-signature': signature, 'X-Village-Delivery': delivery }, rawBody, body: JSON.parse(rawBody) },
        },
      ]);
    };
    expect(await deliver({ delivery: 'd1', timestamp: '2026-11-17T08:25:02.137Z' })).toHaveLength(1);
    expect(await deliver({ delivery: 'd1', timestamp: '2026-11-17T08:25:02.137Z' })).toEqual([]);
    expect(await deliver({ delivery: 'd2', timestamp: '2026-11-17T08:26:00.000Z' })).toHaveLength(1);
  });
});

describe('trigger signature formats', () => {
  const secret = 'b'.repeat(64);
  const signedDelivery = async ({ id, header }: { id: string; header: (rawBody: string) => string }) => {
    const store = createStore();
    await store.put('village_new_event_webhook', { webhookId: 'wh', secret });
    const rawBody = JSON.stringify({ id, type: 'job_change' });
    return Reflect.apply(newVillageEvent.run, undefined, [
      { store, propsValue: {}, auth: { secret_text: 't' }, payload: { headers: { 'x-village-signature': header(rawBody) }, rawBody, body: JSON.parse(rawBody) } },
    ]);
  };
  const hmac = ({ payload, encoding }: { payload: string; encoding: 'hex' | 'base64' }) =>
    createHmac('sha256', secret).update(payload).digest(encoding);

  it.each([
    ['bare hex', (raw: string) => hmac({ payload: raw, encoding: 'hex' })],
    ['sha256=<hex>', (raw: string) => `sha256=${hmac({ payload: raw, encoding: 'hex' })}`],
    ['bare base64', (raw: string) => hmac({ payload: raw, encoding: 'base64' })],
    ['sha256=<base64>', (raw: string) => `sha256=${hmac({ payload: raw, encoding: 'base64' })}`],
    ['v1=<base64>', (raw: string) => `v1=${hmac({ payload: raw, encoding: 'base64' })}`],
    ['t=..,v1=<hex>', (raw: string) => `t=1700000000,v1=${hmac({ payload: `1700000000.${raw}`, encoding: 'hex' })}`],
  ])('accepts %s', async (_name, header) => {
    expect(hmac({ payload: 'x', encoding: 'base64' }).endsWith('=')).toBe(true);
    expect(await signedDelivery({ id: 'evt', header })).toHaveLength(1);
  });

  it('never accepts the timestamp itself as a signature', async () => {
    expect(await signedDelivery({ id: 'evt', header: () => 't=1700000000' })).toEqual([]);
  });
});

function mockOk(body: unknown) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

function runStep({ step, props }: { step: { run: unknown }; props: Record<string, unknown> }): Promise<unknown> {
  if (typeof step.run !== 'function') {
    throw new Error('step has no run');
  }
  return Reflect.apply(step.run, undefined, [{ auth: { secret_text: 't' }, propsValue: props }]);
}

function createStore() {
  const data = new Map<string, unknown>();
  return {
    get: async (key: string) => (data.has(key) ? data.get(key) : null),
    put: async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}
