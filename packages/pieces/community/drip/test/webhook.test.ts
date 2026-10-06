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
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toEqual([d.body]);
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
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toEqual([d.body]);
    expect(seen[0].path).toBe(`/${A}/subscribers/z1tog`);
    vi.unstubAllGlobals();
    stubFetch(() => ({ status: 404, body: { errors: [{ code: 'not_found_error', message: 'nf' }] } }));
    const forged = delivery({ token: 'anything', occurredAt: '2026-10-06T16:00:00Z' });
    await expect(call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: forged }) })).resolves.toEqual([]);
  });
  test('missing token falls back to re-fetching the subscriber and emits Drip data', async () => {
    const fresh = { ...SUB, first_name: 'From Drip' };
    const seen = stubFetch(() => ({ body: { subscribers: [fresh] } }));
    const store = stored({ key: NEW_SUB_KEY });
    const result = await call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery({ token: null }) }) });
    expect(seen[0].path).toBe(`/${A}/subscribers/z1tog`);
    expect(result).toEqual([{ ...delivery().body, data: { account_id: A, subscriber: fresh } }]);
  });
  test('missing token: unknown subscriber, other email, or tag state not matching → dropped', async () => {
    const store = stored({ key: TAG_KEY });
    stubFetch(() => ({ status: 404, body: { errors: [{ code: 'not_found_error', message: 'nf' }] } }));
    await expect(call({ trigger: dripTagAppliedEvent, fn: 'run', context: ctx({ store, payload: delivery({ event: 'subscriber.applied_tag', token: null, properties: { tag: 'vip' } }) }) })).resolves.toEqual([]);
    vi.unstubAllGlobals();
    stubFetch(() => ({ body: { subscribers: [{ ...SUB, email: 'other@x.co' }] } }));
    await expect(call({ trigger: dripTagAppliedEvent, fn: 'run', context: ctx({ store, payload: delivery({ event: 'subscriber.applied_tag', token: null, properties: { tag: 'vip' } }) }) })).resolves.toEqual([]);
    vi.unstubAllGlobals();
    stubFetch(() => ({ body: { subscribers: [SUB] } }));
    await expect(call({ trigger: dripTagAppliedEvent, fn: 'run', context: ctx({ store, payload: delivery({ event: 'subscriber.applied_tag', token: null, properties: { tag: 'other' } }) }) })).resolves.toEqual([]);
    await expect(call<unknown[]>({ trigger: dripTagAppliedEvent, fn: 'run', context: ctx({ store, payload: delivery({ event: 'subscriber.applied_tag', token: null, properties: { tag: 'VIP' } }) }) })).resolves.toHaveLength(1);
    const removedStore = memoryStore({ drip_tag_removed_trigger: { webhookId: '1', userId: A, secret: SECRET } });
    await expect(call({ trigger: dripTagRemovedEvent, fn: 'run', context: ctx({ store: removedStore, payload: delivery({ event: 'subscriber.removed_tag', token: null, properties: { tag: 'vip' } }) }) })).resolves.toEqual([]);
  });
  test('missing token on subscriber.deleted is accepted only when Drip no longer has the subscriber', async () => {
    const store = memoryStore({ drip_subscriber_deleted_trigger: { webhookId: '1', userId: A, secret: SECRET } });
    stubFetch(() => ({ body: { subscribers: [SUB] } }));
    await expect(call({ trigger: dripSubscriberDeletedEvent, fn: 'run', context: ctx({ store, payload: delivery({ event: 'subscriber.deleted', token: null }) }) })).resolves.toEqual([]);
    vi.unstubAllGlobals();
    stubFetch(() => ({ status: 404, body: { errors: [{ code: 'not_found_error', message: 'nf' }] } }));
    await expect(call<unknown[]>({ trigger: dripSubscriberDeletedEvent, fn: 'run', context: ctx({ store, payload: delivery({ event: 'subscriber.deleted', token: null }) }) })).resolves.toHaveLength(1);
  });
  test('duplicate deliveries are emitted once and the dedupe ring is bounded', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery() }) })).resolves.toHaveLength(1);
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery() }) })).resolves.toHaveLength(0);
    for (let i = 0; i < 250; i++) {
      await call({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: delivery({ occurredAt: `2026-10-06T15:${String(i % 60).padStart(2, '0')}:${String(Math.floor(i / 60)).padStart(2, '0')}Z` }) }) });
    }
    const seen = store.read(`${NEW_SUB_KEY}_seen`);
    expect(Array.isArray(seen) ? seen.length : 0).toBe(dripWebhook.SEEN_LIMIT);
    const claims = store.keys().filter((key) => key.startsWith(`${NEW_SUB_KEY}_d_`));
    expect(claims).toHaveLength(dripWebhook.SEEN_LIMIT);
  });
  test('two concurrent runs of the same delivery emit it once (claim token + read-back)', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const runs: Promise<unknown>[] = [1, 2].map(() => Reflect.apply(dripNewSubscriberEvent.run, dripNewSubscriberEvent, [ctx({ store, payload: delivery() })]));
    await vi.runAllTimersAsync();
    const results = await Promise.all(runs);
    expect(results.map((r) => (Array.isArray(r) ? r.length : -1)).sort()).toEqual([0, 1]);
  });
  test('an unfinished claim blocks a retry until it is abandoned, then the retry emits', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const d = delivery();
    const key = dripWebhook.claimKeyOf({ storeKey: NEW_SUB_KEY, key: dedupeKeyOf(d) });
    await store.put(key, { token: 'other', at: Date.now(), done: false });
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(0);
    await store.put(key, { token: 'other', at: Date.now() - dripWebhook.ABANDONED_CLAIM_MS - 1, done: false });
    await expect(call<unknown[]>({ trigger: dripNewSubscriberEvent, fn: 'run', context: ctx({ store, payload: d }) })).resolves.toHaveLength(1);
  });
  test('a store failure while claiming fails the run and releases the claim so a retry can emit', async () => {
    const store = stored({ key: NEW_SUB_KEY });
    const put = store.put;
    let failures = 1;
    store.put = async <T>(key: string, value: T): Promise<T> => {
      if (key.endsWith('_seen') && failures-- > 0) {
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
    expect(store.keys().some((key) => key.startsWith(`${NEW_SUB_KEY}_d_`))).toBe(true);
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
