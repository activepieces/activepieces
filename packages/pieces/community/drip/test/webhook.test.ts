import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { dripWebhook } from '../src/lib/common/webhook';
import { dripCustomEventPerformedEvent } from '../src/lib/trigger/custom-event-performed.trigger';
import { dripNewSubscriberEvent } from '../src/lib/trigger/new-subscriber.trigger';
import { dripTagAppliedEvent } from '../src/lib/trigger/new-tag.trigger';
import { dripSubscribedToCampaignEvent } from '../src/lib/trigger/subscribed-to-campaign.trigger';
import { dripSubscriberDeletedEvent } from '../src/lib/trigger/subscriber-deleted.trigger';
import { dripTagRemovedEvent } from '../src/lib/trigger/tag-removed.trigger';
import { dripConnection, memoryStore, MemoryStore, runStep, stubFetch } from './helpers';

const A = '4617837';
const HOOK = 'https://cloud.example.com/api/v1/webhooks/flow1';
const SECRET = 'a'.repeat(64);
const NEW_SUB_KEY = 'drip_new_subscriber_trigger';
const TAG_KEY = 'drip_tag_applied_to_subscriber_trigger';
const SUB = { id: 'z1tog', email: 'odai+aptest-1@activepieces.com', tags: ['vip'] };

type Hook = { onEnable: (ctx: never) => Promise<unknown>; onDisable: (ctx: never) => Promise<unknown>; run: (ctx: never) => Promise<unknown> };

function ctx({ store, propsValue = { account_id: A }, payload }: { store: MemoryStore; propsValue?: Record<string, unknown>; payload?: unknown }) {
  return { auth: dripConnection(), propsValue, store, webhookUrl: HOOK, payload };
}

function call<T>({ trigger, fn, context }: { trigger: Hook; fn: keyof Hook; context: unknown }): Promise<T> {
  return runStep(Reflect.apply(trigger[fn], trigger, [context]));
}

function delivery({ event = 'subscriber.created', token = SECRET, properties, account = A, occurredAt = '2026-10-06T15:31:58Z' }: { event?: string; token?: string | null; properties?: Record<string, unknown>; account?: string; occurredAt?: string } = {}) {
  return {
    body: { event, data: { account_id: account, subscriber: SUB, ...(properties ? { properties } : {}) }, occurred_at: occurredAt },
    headers: {},
    queryParams: token === null ? {} : { ap_token: token },
  };
}

function dedupeKeyOf(d: ReturnType<typeof delivery>): string {
  const parts = [d.body.event, d.body.data.subscriber.id, d.body.occurred_at, JSON.stringify(Reflect.get(d.body.data, 'properties') ?? null)];
  return createHash('sha256').update(parts.join('|')).digest('hex');
}

function emitted({ body, storeKey = NEW_SUB_KEY }: { body: unknown; storeKey?: string }) {
  return { ...Object(body), _dedupe_key: expect.stringMatching(new RegExp(`^drip:${storeKey}:[0-9a-f]{64}$`)) };
}

function cellsOf(d: ReturnType<typeof delivery>): string[] {
  return dripWebhook.probeCells({ storeKey: NEW_SUB_KEY, key: dedupeKeyOf(d) });
}

function stored({ key, extra = { secret: SECRET } }: { key: string; extra?: Record<string, unknown> }) {
  return memoryStore({ [key]: { webhookId: '77', userId: A, ...extra } });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('onEnable / onDisable', () => {
  test('registers the event with a random ap_token on the URL and stores id, account and secret', async () => {
    const seen = stubFetch(() => ({ status: 201, body: { webhooks: [{ id: '77', post_url: 'x' }] } }));
    const store = memoryStore();
    await call({ trigger: dripNewSubscriberEvent, fn: 'onEnable', context: ctx({ store }) });
    expect(seen[0].url).toBe(`https://api.getdrip.com/v2/${A}/webhooks`);
    const webhooks: unknown = Reflect.get(Object(seen[0].body), 'webhooks');
    const first: object = Array.isArray(webhooks) ? Object(webhooks[0]) : {};
    expect(Reflect.get(first, 'events')).toEqual(['subscriber.created']);
    const registered = new URL(String(Reflect.get(first, 'post_url')));
    expect(`${registered.origin}${registered.pathname}`).toBe(HOOK);
    const token = registered.searchParams.get('ap_token') ?? '';
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(store.read(NEW_SUB_KEY)).toEqual({ webhookId: '77', userId: A, secret: token });
  });
  test('two enables get different secrets', async () => {
    stubFetch(() => ({ status: 201, body: { webhooks: [{ id: '77' }] } }));
    const one = memoryStore();
    const two = memoryStore();
    await call({ trigger: dripNewSubscriberEvent, fn: 'onEnable', context: ctx({ store: one }) });
    await call({ trigger: dripNewSubscriberEvent, fn: 'onEnable', context: ctx({ store: two }) });
    expect(Reflect.get(Object(one.read(NEW_SUB_KEY)), 'secret')).not.toBe(Reflect.get(Object(two.read(NEW_SUB_KEY)), 'secret'));
  });
  test('deletes the webhook it created when store.put fails', async () => {
    const seen = stubFetch((request) => (request.method === 'POST' ? { status: 201, body: { webhooks: [{ id: '77' }] } } : { status: 204 }));
    const store = memoryStore();
    store.put = async () => {
      throw new Error('store down');
    };
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'onEnable', context: ctx({ store }) })).rejects.toThrow('store down');
    expect(seen.map((r) => `${r.method} ${r.path}`)).toEqual([`POST /${A}/webhooks`, `DELETE /${A}/webhooks/77`]);
  });
  test('fails when Drip returns no webhook id', async () => {
    stubFetch(() => ({ status: 201, body: { webhooks: [] } }));
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'onEnable', context: ctx({ store: memoryStore() }) })).rejects.toThrow('no webhooks record');
  });
  test('onDisable deletes and forgets; 404 counts as deleted', async () => {
    const seen = stubFetch(() => ({ status: 404, body: { errors: [{ code: 'not_found_error', message: 'nf' }] } }));
    const store = stored({ key: NEW_SUB_KEY });
    await call({ trigger: dripNewSubscriberEvent, fn: 'onDisable', context: ctx({ store }) });
    expect(seen[0].method).toBe('DELETE');
    expect(seen[0].path).toBe(`/${A}/webhooks/77`);
    expect(store.read(NEW_SUB_KEY)).toBeUndefined();
  });
  test('onDisable keeps the stored id when the delete fails', async () => {
    stubFetch(() => ({ status: 500, body: { errors: [{ code: 'x', message: 'boom' }] } }));
    const store = stored({ key: NEW_SUB_KEY });
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'onDisable', context: ctx({ store }) })).rejects.toThrow('boom');
    expect(store.read(NEW_SUB_KEY)).toEqual({ webhookId: '77', userId: A, secret: SECRET });
  });
  test('onDisable works for a legacy (0.5.x) store entry', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    const store = memoryStore({ [TAG_KEY]: { webhookId: '12', userId: A } });
    await call({ trigger: dripTagAppliedEvent, fn: 'onDisable', context: ctx({ store }) });
    expect(seen[0].path).toBe(`/${A}/webhooks/12`);
    expect(store.read(TAG_KEY)).toBeUndefined();
  });
});

describe('run', () => {
  test('emits a delivery with the right token, event and account', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const d = delivery();
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toEqual([emitted({ body: d.body })]);
  });
  test('drops a wrong token, another event, another account, and anything without a registration', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    const store = stored({ key: NEW_SUB_KEY });
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery({ token: 'b'.repeat(64) }) }) })).resolves.toEqual([]);
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery({ token: 'short' }) }) })).resolves.toEqual([]);
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery({ event: 'subscriber.deleted' }) }) })).resolves.toEqual([]);
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery({ account: '1' }) }) })).resolves.toEqual([]);
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store: memoryStore(), payload: delivery() }) })).resolves.toEqual([]);
    expect(seen).toHaveLength(0);
  });
  test('legacy store entries without a secret are verified by re-fetching the subscriber from Drip', async () => {
    const store = stored({ key: NEW_SUB_KEY, extra: {} });
    const seen = stubFetch(() => ({ body: { subscribers: [SUB] } }));
    const d = delivery({ token: null });
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toEqual([emitted({ body: d.body })]);
    expect(seen[0].path).toBe(`/${A}/subscribers/z1tog`);
    vi.unstubAllGlobals();
    stubFetch(() => ({ status: 404, body: { errors: [{ code: 'not_found_error', message: 'nf' }] } }));
    const forged = delivery({ token: 'anything', occurredAt: '2026-10-06T16:00:00Z' });
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: forged }) })).resolves.toEqual([]);
  });
  test('a registration with a secret drops deliveries without ap_token and never calls Drip', async () => {
    const seen = stubFetch(() => ({ status: 404, body: { errors: [{ code: 'not_found_error', message: 'nf' }] } }));
    const store = stored({ key: NEW_SUB_KEY });
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery({ token: null }) }) })).resolves.toEqual([]);
    const deletedStore = memoryStore({ drip_subscriber_deleted_trigger: { webhookId: '1', userId: A, secret: SECRET } });
    const forged = delivery({ event: 'subscriber.deleted', token: null, occurredAt: '2026-10-06T17:00:00Z' });
    await expect(call({ trigger: dripSubscriberDeletedEvent, fn: 'run', context: ctx({ store: deletedStore, payload: forged }) })).resolves.toEqual([]);
    expect(seen).toHaveLength(0);
  });
  test('legacy store entries (no secret): unknown subscriber, other email, or tag state not matching → dropped', async () => {
    const store = stored({ key: TAG_KEY, extra: {} });
    stubFetch(() => ({ status: 404, body: { errors: [{ code: 'not_found_error', message: 'nf' }] } }));
    await expect(call({ trigger: dripTagAppliedEvent, fn: 'run', context: ctx({ store, payload: delivery({ event: 'subscriber.applied_tag', token: null, properties: { tag: 'vip' } }) }) })).resolves.toEqual([]);
    vi.unstubAllGlobals();
    stubFetch(() => ({ body: { subscribers: [{ ...SUB, email: 'other@x.co' }] } }));
    await expect(call({ trigger: dripTagAppliedEvent, fn: 'run', context: ctx({ store, payload: delivery({ event: 'subscriber.applied_tag', token: null, properties: { tag: 'vip' } }) }) })).resolves.toEqual([]);
    vi.unstubAllGlobals();
    const fresh = { ...SUB, first_name: 'From Drip' };
    stubFetch(() => ({ body: { subscribers: [fresh] } }));
    await expect(call({ trigger: dripTagAppliedEvent, fn: 'run', context: ctx({ store, payload: delivery({ event: 'subscriber.applied_tag', token: null, properties: { tag: 'other' } }) }) })).resolves.toEqual([]);
    const applied = delivery({ event: 'subscriber.applied_tag', token: null, properties: { tag: 'VIP' } });
    await expect(call<unknown[]>({ trigger: dripTagAppliedEvent, fn: 'run', context: ctx({ store, payload: applied }) })).resolves.toEqual([
      emitted({ body: { ...applied.body, data: { ...applied.body.data, subscriber: fresh } }, storeKey: TAG_KEY }),
    ]);
    const removedStore = memoryStore({ drip_tag_removed_trigger: { webhookId: '1', userId: A } });
    await expect(call({ trigger: dripTagRemovedEvent, fn: 'run', context: ctx({ store: removedStore, payload: delivery({ event: 'subscriber.removed_tag', token: null, properties: { tag: 'vip' } }) }) })).resolves.toEqual([]);
  });
  test('subscriber.deleted is emitted only with the right ap_token; a legacy entry without a secret never emits it', async () => {
    const seen = stubFetch(() => ({ status: 404, body: { errors: [{ code: 'not_found_error', message: 'nf' }] } }));
    const store = memoryStore({ drip_subscriber_deleted_trigger: { webhookId: '1', userId: A, secret: SECRET } });
    await expect(call<unknown[]>({ trigger: dripSubscriberDeletedEvent, fn: 'run', context: ctx({ store, payload: delivery({ event: 'subscriber.deleted' }) }) })).resolves.toHaveLength(1);
    const legacy = memoryStore({ drip_subscriber_deleted_trigger: { webhookId: '1', userId: A } });
    await expect(call({ trigger: dripSubscriberDeletedEvent, fn: 'run', context: ctx({ store: legacy, payload: delivery({ event: 'subscriber.deleted', token: null }) }) })).resolves.toEqual([]);
    expect(seen).toHaveLength(0);
  });
  test('duplicate deliveries are emitted once and the claim cells are a fixed, bounded set', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery() }) })).resolves.toHaveLength(1);
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery() }) })).resolves.toHaveLength(0);
    for (let i = 0; i < 600; i++) {
      await call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery({ occurredAt: `2026-10-06T${String(10 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:00Z` }) }) });
    }
    const claimKeys = store.keys().filter((key) => key !== NEW_SUB_KEY);
    expect(claimKeys.every((key) => /_c_\d+(_ok)?$/.test(key))).toBe(true);
    expect(claimKeys.length).toBeLessThanOrEqual(dripWebhook.CLAIM_CELLS * 2);
  });
  test('two concurrent runs of the same delivery emit it once (claim token + read-back)', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const runs: Promise<unknown>[] = [1, 2].map(() => Reflect.apply(dripNewSubscriberEvent.run, dripNewSubscriberEvent, [ctx({ store, payload: delivery() })]));
    await vi.runAllTimersAsync();
    const results = await Promise.all(runs);
    expect(results.map((r) => (Array.isArray(r) ? r.length : -1)).sort()).toEqual([0, 1]);
  });
  test('a repeat of an emitted delivery within the claim window is dropped and carries the same platform dedupe key', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const first = await call<Record<string, unknown>[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery() }) });
    expect(first).toHaveLength(1);
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery() }) })).resolves.toHaveLength(0);
    const other = await call<Record<string, unknown>[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery({ occurredAt: '2026-10-06T18:00:00Z' }) }) });
    expect(other[0]['_dedupe_key']).not.toBe(first[0]['_dedupe_key']);
  });
  test('a completed claim keeps blocking repeats after the claim window', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const d = delivery();
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(1);
    const [cell] = cellsOf(d);
    const claim = Object(store.read(cell));
    expect(claim).toMatchObject({ key: dedupeKeyOf(d) });
    expect(store.read(dripWebhook.doneKeyOf(cell))).toEqual(claim);
    await store.put(cell, { ...claim, at: Date.now() - 24 * 60 * 60 * 1000 });
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(0);
  });
  test('another delivery\'s completed claim in a shared cell is kept while a free probe cell exists', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const d = delivery();
    const [first, second] = cellsOf(d);
    const other = { key: 'f'.repeat(64), token: 'other', at: Date.now() };
    await store.put(first, other);
    await store.put(dripWebhook.doneKeyOf(first), other);
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(1);
    expect(store.read(dripWebhook.doneKeyOf(first))).toEqual(other);
    expect(store.read(dripWebhook.doneKeyOf(second))).toMatchObject({ key: dedupeKeyOf(d) });
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(0);
  });
  test('when every probe cell is taken, only the oldest one is reused', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const d = delivery();
    const cells = cellsOf(d);
    const now = Date.now();
    for (const [index, cell] of cells.entries()) {
      const record = { key: `other-${index}`, token: `t${index}`, at: now - 1000 * (10 - index) };
      await store.put(cell, record);
      await store.put(dripWebhook.doneKeyOf(cell), record);
    }
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(1);
    expect(store.read(dripWebhook.doneKeyOf(cells[0]))).toMatchObject({ key: dedupeKeyOf(d) });
    for (const [index, cell] of cells.entries()) {
      if (index > 0) {
        expect(store.read(dripWebhook.doneKeyOf(cell))).toMatchObject({ key: `other-${index}` });
      }
    }
  });
  test('a run whose claim write landed late does not emit a delivery another run already finished', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const d = delivery();
    const [first, second] = cellsOf(d);
    const put = store.put;
    store.put = async <T>(key: string, value: T): Promise<T> => {
      const result = await put(key, value);
      if (key === first) {
        await put(dripWebhook.doneKeyOf(second), { key: dedupeKeyOf(d), token: 'first-run', at: Date.now() });
      }
      return result;
    };
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(0);
    expect(store.read(dripWebhook.doneKeyOf(first))).toBeUndefined();
  });
  test('a different delivery taking the same cell during the settle wait moves this claim to the next cell', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const d = delivery();
    const [first, second] = cellsOf(d);
    const put = store.put;
    let takeovers = 1;
    store.put = async <T>(key: string, value: T): Promise<T> => {
      const result = await put(key, value);
      if (key === first && takeovers-- > 0) {
        await put(first, { key: 'e'.repeat(64), token: 'other', at: Date.now() });
      }
      return result;
    };
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(1);
    expect(store.read(first)).toMatchObject({ key: 'e'.repeat(64) });
    expect(store.read(dripWebhook.doneKeyOf(second))).toMatchObject({ key: dedupeKeyOf(d) });
  });
  test('a delivery whose claim cells are all taken during the settle wait is still recorded before it is emitted', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const d = delivery();
    const key = dedupeKeyOf(d);
    const cells = cellsOf(d);
    const put = store.put;
    let contended = true;
    store.put = async <T>(cellKey: string, value: T): Promise<T> => {
      const result = await put(cellKey, value);
      if (contended && cells.includes(cellKey) && Reflect.get(Object(value), 'key') === key) {
        await put(cellKey, { key: `other-${cellKey}`, token: 'other', at: Date.now() });
      }
      return result;
    };
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(1);
    contended = false;
    expect(cells.some((cell) => Reflect.get(Object(store.read(dripWebhook.doneKeyOf(cell))), 'key') === key)).toBe(true);
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(0);
  });
  test('an unfinished claim blocks a retry until it is abandoned, then the retry emits', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const d = delivery();
    const [cell] = cellsOf(d);
    await store.put(cell, { key: dedupeKeyOf(d), token: 'other', at: Date.now() });
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(0);
    await store.put(cell, { key: dedupeKeyOf(d), token: 'other', at: Date.now() - dripWebhook.ABANDONED_CLAIM_MS - 1 });
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(1);
  });
  test('a store failure while claiming fails the run and releases the claim so a retry can emit', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const put = store.put;
    let failures = 1;
    store.put = async <T>(key: string, value: T): Promise<T> => {
      if (key.endsWith('_ok') && failures-- > 0) {
        throw new Error('store down');
      }
      return put(key, value);
    };
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery() }) })).rejects.toThrow('store down');
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery() }) })).resolves.toHaveLength(1);
  });
  test('onDisable also clears the delivery claims', async () => {
    stubFetch(() => ({ status: 204 }));
    const store = stored({ key: NEW_SUB_KEY });
    await call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery() }) });
    expect(store.keys().some((key) => key.startsWith(`${NEW_SUB_KEY}_c_`))).toBe(true);
    await call({ trigger: dripNewSubscriberEvent, fn: 'onDisable', context: ctx({ store }) });
    expect(store.keys()).toEqual([]);
  });
  test('tag, campaign and event-name filters', async () => {
    const tagStore = stored({ key: TAG_KEY });
    const tagCtx = ({ tag, filter }: { tag: string; filter?: string }) => ctx({ store: tagStore, propsValue: { account_id: A, tag: filter }, payload: delivery({ event: 'subscriber.applied_tag', properties: { tag }, occurredAt: `2026-01-01T00:00:0${tag.length % 10}Z` }) });
    await expect(call<unknown[]>({ trigger: dripTagAppliedEvent, fn: 'run', context: tagCtx({ tag: 'Customer', filter: ' customer ' }) })).resolves.toHaveLength(1);
    await expect(call<unknown[]>({ trigger: dripTagAppliedEvent, fn: 'run', context: tagCtx({ tag: 'Lead', filter: 'customer' }) })).resolves.toHaveLength(0);
    await expect(call<unknown[]>({ trigger: dripTagAppliedEvent, fn: 'run', context: tagCtx({ tag: 'Anything' }) })).resolves.toHaveLength(1);
    const campaignStore = memoryStore({ drip_subscribed_to_campaign_trigger: { webhookId: '1', userId: A, secret: SECRET } });
    const campaignCtx = ({ campaign, filter }: { campaign: string; filter?: string }) =>
      ctx({ store: campaignStore, propsValue: { account_id: A, campaign_id: filter }, payload: delivery({ event: 'subscriber.subscribed_to_campaign', properties: { campaign_id: campaign, campaign_name: 'S' }, occurredAt: `2026-01-01T00:00:${campaign}Z` }) });
    await expect(call<unknown[]>({ trigger: dripSubscribedToCampaignEvent, fn: 'run', context: campaignCtx({ campaign: '11', filter: '11' }) })).resolves.toHaveLength(1);
    await expect(call<unknown[]>({ trigger: dripSubscribedToCampaignEvent, fn: 'run', context: campaignCtx({ campaign: '12', filter: '11' }) })).resolves.toHaveLength(0);
    await expect(call<unknown[]>({ trigger: dripSubscribedToCampaignEvent, fn: 'run', context: campaignCtx({ campaign: '13' }) })).resolves.toHaveLength(1);
    const eventStore = memoryStore({ drip_custom_event_performed_trigger: { webhookId: '1', userId: A, secret: SECRET } });
    const eventCtx = ({ action, filter }: { action: string; filter?: string }) => ctx({ store: eventStore, propsValue: { account_id: A, action: filter }, payload: delivery({ event: 'subscriber.performed_custom_event', properties: { action } }) });
    await expect(call<unknown[]>({ trigger: dripCustomEventPerformedEvent, fn: 'run', context: eventCtx({ action: 'Logged in', filter: 'logged in' }) })).resolves.toHaveLength(1);
    await expect(call<unknown[]>({ trigger: dripCustomEventPerformedEvent, fn: 'run', context: eventCtx({ action: 'Signed up', filter: 'logged in' }) })).resolves.toHaveLength(0);
  });
  test('withToken keeps existing query parameters', () => {
    const url = new URL(dripWebhook.withToken({ url: 'https://x.example/hook?a=1', secret: 's' }));
    expect(url.searchParams.get('a')).toBe('1');
    expect(url.searchParams.get('ap_token')).toBe('s');
  });
});
