import { createHmac } from 'crypto';
import { candidateStageChanged } from '../src/lib/triggers/candidate-stage-changed';
import { newCandidate } from '../src/lib/triggers/new-candidate';
import { accountsReply, AUTH, BASE, memoryStore, mockHttp, SUB, TOKEN } from './helpers';

const HOOK = 'https://cloud.example.com/api/v1/webhooks/flow1';

type Trigger = typeof newCandidate;

function on(trigger: Trigger) {
  const call = (hook: 'run' | 'onEnable' | 'onDisable' | 'test') => (extra: Record<string, unknown>) =>
    Reflect.apply(trigger[hook], trigger, [{ auth: AUTH, webhookUrl: HOOK, propsValue: {}, ...extra }]);
  return { run: call('run'), onEnable: call('onEnable'), onDisable: call('onDisable'), test: call('test') };
}

function signed({ body, token = TOKEN, encoding = 'hex' }: { body: unknown; token?: string; encoding?: 'hex' | 'base64' }) {
  const rawBody = JSON.stringify(body);
  const signature = createHmac('sha256', token).update(rawBody).digest(encoding);
  return { body, rawBody, headers: { 'x-workable-signature': signature } };
}

function envelope(extra: Record<string, unknown> = {}) {
  return {
    id: 'evt-1',
    event_type: 'candidate_created',
    resource_type: 'candidate',
    fired_at: new Date().toISOString(),
    data: { id: 'c1', name: 'Jane Doe' },
    ...extra,
  };
}

describe('webhook lifecycle', () => {
  it('onEnable sends account_id in args and stores the ID with the subdomain', async () => {
    const requests = mockHttp([accountsReply, { status: 201, body: { id: 42 } }]);
    const store = memoryStore();
    await on(newCandidate).onEnable({ store, propsValue: { shortcode: 'J1' } });
    expect(requests[1].url).toBe(`${BASE}/subscriptions`);
    expect(requests[1].body).toEqual({
      target: HOOK,
      event: 'candidate_created',
      args: { account_id: SUB, job_shortcode: 'J1', stage_slug: '' },
    });
    expect(store.data.get('_new_candidate_created')).toEqual({ webhookId: '42', subdomain: SUB });
  });

  it('onEnable on 409 deletes the old subscription for this URL and retries', async () => {
    const requests = mockHttp([
      { error: { status: 409, body: { error: 'exists' } } },
      { body: { subscriptions: [{ id: 7, target: HOOK }, { id: 8, target: 'https://other' }] } },
      { status: 204, body: '' },
      { status: 201, body: { id: 9 } },
    ]);
    const store = memoryStore();
    await on(candidateStageChanged).onEnable({ store, propsValue: { account_subdomain: SUB, stage_slug: 'offer' } });
    expect(requests.map((r) => `${r.method} ${r.url}`)).toEqual([
      `POST ${BASE}/subscriptions`,
      `GET ${BASE}/subscriptions`,
      `DELETE ${BASE}/subscriptions/7`,
      `POST ${BASE}/subscriptions`,
    ]);
    expect(requests[0].body).toMatchObject({ event: 'candidate_moved' });
    expect(store.data.get('_candidate_stage_changed')).toEqual({ webhookId: '9', subdomain: SUB });
  });

  it('onEnable deletes the subscription when store.put fails', async () => {
    const requests = mockHttp([{ status: 201, body: { id: 5 } }, { status: 204, body: '' }]);
    const store = { ...memoryStore(), put: async () => Promise.reject(new Error('store down')) };
    await expect(on(newCandidate).onEnable({ store, propsValue: { account_subdomain: SUB } })).rejects.toThrow('store down');
    expect(`${requests[1].method} ${requests[1].url}`).toBe(`DELETE ${BASE}/subscriptions/5`);
  });

  it('onDisable treats 404 as deleted and clears the store keys, also for the old store format', async () => {
    const requests = mockHttp([accountsReply, { error: { status: 404, body: { error: 'Not found' } } }]);
    const store = memoryStore({ _new_candidate_created: { webhookId: '42' }, _new_candidate_created_deliveries: ['x'] });
    await on(newCandidate).onDisable({ store });
    expect(requests[1].url).toBe(`${BASE}/subscriptions/42`);
    expect(store.data.size).toBe(0);
  });

  it('onDisable rethrows other errors and keeps the key', async () => {
    mockHttp([{ error: { status: 500, body: '' } }]);
    const store = memoryStore({ _new_candidate_created: { webhookId: '42', subdomain: SUB } });
    await expect(on(newCandidate).onDisable({ store })).rejects.toThrow('server error');
    expect(store.data.has('_new_candidate_created')).toBe(true);
  });
});

describe('webhook deliveries', () => {
  it('accepts a valid hex or base64 HMAC and returns the candidate', async () => {
    mockHttp([]);
    const store = memoryStore();
    const first = await on(newCandidate).run({ store, payload: signed({ body: envelope() }) });
    expect(first).toEqual([expect.objectContaining({ id: 'c1', name: 'Jane Doe', event_type: 'candidate_created' })]);
    const second = await on(newCandidate).run({ store, payload: signed({ body: envelope({ id: 'evt-2' }), encoding: 'base64' }) });
    expect(second).toHaveLength(1);
  });

  it('rejects missing, wrong-key and tampered signatures', async () => {
    mockHttp([]);
    const store = memoryStore();
    const missing = { ...signed({ body: envelope() }), headers: {} };
    expect(await on(newCandidate).run({ store, payload: missing })).toEqual([]);
    expect(await on(newCandidate).run({ store, payload: signed({ body: envelope(), token: 'other' }) })).toEqual([]);
    const tampered = { ...signed({ body: envelope() }), rawBody: JSON.stringify(envelope({ data: { id: 'evil' } })) };
    expect(await on(newCandidate).run({ store, payload: tampered })).toEqual([]);
    const noRaw = { body: envelope(), headers: signed({ body: envelope() }).headers };
    expect(await on(newCandidate).run({ store, payload: noRaw })).toEqual([]);
  });

  it('dedupes retries by event ID and bounds the store', async () => {
    mockHttp([]);
    const store = memoryStore({ _new_candidate_created_deliveries: Array.from({ length: 500 }, (_, i) => `old-${i}`) });
    const payload = signed({ body: envelope() });
    expect(await on(newCandidate).run({ store, payload })).toHaveLength(1);
    expect(await on(newCandidate).run({ store, payload })).toEqual([]);
    const seen: unknown = store.data.get('_new_candidate_created_deliveries');
    if (!Array.isArray(seen)) throw new Error('deliveries not stored');
    expect(seen).toHaveLength(500);
    expect(seen[seen.length - 1]).toBe('evt-1');
  });

  it('drops events outside the 6 hour window and other event types', async () => {
    mockHttp([]);
    const store = memoryStore();
    const old = signed({ body: envelope({ fired_at: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString() }) });
    expect(await on(newCandidate).run({ store, payload: old })).toEqual([]);
    const lagged = signed({ body: envelope({ id: 'evt-lag', fired_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }) });
    expect(await on(newCandidate).run({ store, payload: lagged })).toHaveLength(1);
    const moved = signed({ body: envelope({ id: 'evt-3', event_type: 'candidate_moved' }) });
    expect(await on(newCandidate).run({ store, payload: moved })).toEqual([]);
    expect(await on(candidateStageChanged).run({ store: memoryStore(), payload: moved })).toHaveLength(1);
  });

  it('test() returns the newest full candidates in the run() shape', async () => {
    const requests = mockHttp([
      { body: { candidates: [{ id: 'c1' }, { id: 'c2' }] } },
      { body: { candidate: { id: 'c2', updated_at: '2026-10-20T00:00:00Z' } } },
      { body: { candidate: { id: 'c1', updated_at: '2026-10-19T00:00:00Z' } } },
    ]);
    const result = await on(newCandidate).test({ store: memoryStore(), propsValue: { account_subdomain: SUB, shortcode: 'J1', stage_slug: 'applied' } });
    expect(requests[0].url).toBe(`${BASE}/candidates`);
    expect(requests[0].queryParams).toMatchObject({ shortcode: 'J1', stage: 'applied', limit: '100' });
    expect(requests[0].queryParams).toHaveProperty('created_after');
    expect(result).toEqual([
      { id: 'c2', updated_at: '2026-10-20T00:00:00Z', event_type: 'candidate_created', fired_at: '2026-10-20T00:00:00Z' },
      { id: 'c1', updated_at: '2026-10-19T00:00:00Z', event_type: 'candidate_created', fired_at: '2026-10-19T00:00:00Z' },
    ]);
  });
});
