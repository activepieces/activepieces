import { afterEach, describe, expect, test, vi } from 'vitest';
import { newSubscriberCreatedTrigger } from '../src/lib/triggers/new-subscriber-created.trigger';
import { userUnsubscribesTrigger } from '../src/lib/triggers/user-unsubscribes.trigger';
import { newPostSentTrigger } from '../src/lib/triggers/new-post-sent.trigger';
import { newSubscriptionConfirmedTrigger } from '../src/lib/triggers/new-subscription-confirmed.trigger';
import { AUTH, PUB, SUBSCRIPTION, memoryStore, stubBeehiiv } from './helpers';

afterEach(() => vi.restoreAllMocks());

const KEY = 'new-subscriber-created-trigger';

function hookContext({ store, body, headers }: { store: ReturnType<typeof memoryStore>; body?: unknown; headers?: Record<string, string> }) {
  return {
    auth: AUTH,
    propsValue: { publicationId: PUB },
    store,
    webhookUrl: 'https://ap.example.com/hook',
    payload: { body, headers: headers ?? {}, queryParams: {} },
  };
}

describe('webhook triggers', () => {
  test('names, store keys and output schemas are kept', () => {
    expect([newPostSentTrigger, newSubscriberCreatedTrigger, newSubscriptionConfirmedTrigger, userUnsubscribesTrigger].map((t) => t.name)).toEqual([
      'beehiiv_new_post_sent',
      'beehiiv_new_subscriber_created',
      'beehiiv_new_subscription_confirmed',
      'beehiiv_user_unsubscribes',
    ]);
    for (const trigger of [newPostSentTrigger, newSubscriberCreatedTrigger, newSubscriptionConfirmedTrigger, userUnsubscribesTrigger]) {
      expect(trigger.outputSchema).toBeDefined();
    }
  });

  test('onEnable creates the webhook with a description and stores its ID', async () => {
    const store = memoryStore();
    const seen = stubBeehiiv({ replies: [{ body: { data: { id: 'ep_1' } } }] });
    await newSubscriberCreatedTrigger.onEnable(hookContext({ store }));
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe(`/v2/publications/${PUB}/webhooks`);
    expect(seen[0].body).toEqual({ url: 'https://ap.example.com/hook', event_types: ['subscription.created'], description: 'Activepieces trigger: New Subscriber Created' });
    expect(store.data.get(KEY)).toBe('ep_1');
  });

  test('onEnable deletes the new webhook when storing its ID fails', async () => {
    const store = memoryStore();
    store.put = async () => {
      throw new Error('store down');
    };
    const seen = stubBeehiiv({ replies: [{ body: { data: { id: 'ep_1' } } }, { status: 204 }] });
    await expect(newSubscriberCreatedTrigger.onEnable(hookContext({ store }))).rejects.toThrow('store down');
    expect(seen.map((r) => `${r.method} ${r.path}`)).toEqual([`POST /v2/publications/${PUB}/webhooks`, `DELETE /v2/publications/${PUB}/webhooks/ep_1`]);
  });

  test('onDisable treats 404 as already deleted and forgets the ID', async () => {
    const store = memoryStore({ initial: { [KEY]: 'ep_1' } });
    stubBeehiiv({ replies: [{ status: 404, body: { errors: [{ message: 'not found' }] } }] });
    await newSubscriberCreatedTrigger.onDisable(hookContext({ store }));
    expect(store.data.has(KEY)).toBe(false);
  });

  test('onDisable keeps the ID when the delete fails for another reason', async () => {
    const store = memoryStore({ initial: { [KEY]: 'ep_1' } });
    stubBeehiiv({ replies: [{ status: 500, body: { errors: [{ message: 'boom' }] } }] });
    await expect(newSubscriberCreatedTrigger.onDisable(hookContext({ store }))).rejects.toThrow('HTTP 500');
    expect(store.data.get(KEY)).toBe('ep_1');
  });

  test('run dedupes on uid and parses a string body', async () => {
    const store = memoryStore();
    const event = { uid: 'evt_1', event_type: 'subscription.created', data: SUBSCRIPTION };
    expect(await newSubscriberCreatedTrigger.run(hookContext({ store, body: JSON.stringify(event) }))).toEqual([SUBSCRIPTION]);
    expect(await newSubscriberCreatedTrigger.run(hookContext({ store, body: event }))).toEqual([]);
  });

  test('run falls back to the svix-id header when uid is missing', async () => {
    const store = memoryStore();
    const event = { data: SUBSCRIPTION };
    expect(await newSubscriberCreatedTrigger.run(hookContext({ store, body: event, headers: { 'Svix-Id': 'msg_1' } }))).toEqual([SUBSCRIPTION]);
    expect(await newSubscriberCreatedTrigger.run(hookContext({ store, body: event, headers: { 'svix-id': 'msg_1' } }))).toEqual([]);
  });

  test('two different events delivered concurrently are both remembered', async () => {
    const store = memoryStore();
    const first = { uid: 'evt_a', data: { id: 'a' } };
    const second = { uid: 'evt_b', data: { id: 'b' } };
    const results = await Promise.all([
      newSubscriberCreatedTrigger.run(hookContext({ store, body: first })),
      newSubscriberCreatedTrigger.run(hookContext({ store, body: second })),
    ]);
    expect(results).toEqual([[{ id: 'a' }], [{ id: 'b' }]]);
    expect(await newSubscriberCreatedTrigger.run(hookContext({ store, body: first }))).toEqual([]);
    expect(await newSubscriberCreatedTrigger.run(hookContext({ store, body: second }))).toEqual([]);
  });

  test('many concurrent different events are all remembered', async () => {
    const store = memoryStore();
    const events = Array.from({ length: 20 }, (_, index) => ({ uid: `evt_${index}`, data: { id: index } }));
    const first = await Promise.all(events.map((event) => newSubscriberCreatedTrigger.run(hookContext({ store, body: event }))));
    expect(first.flat()).toHaveLength(20);
    const again = await Promise.all(events.map((event) => newSubscriberCreatedTrigger.run(hookContext({ store, body: event }))));
    expect(again.flat()).toEqual([]);
  });

  test('the same event delivered twice runs once', async () => {
    const store = memoryStore();
    const event = { uid: 'evt_same', data: SUBSCRIPTION };
    const results = [];
    for (let attempt = 0; attempt < 3; attempt++) {
      results.push(await newSubscriberCreatedTrigger.run(hookContext({ store, body: event })));
    }
    expect(results).toEqual([[SUBSCRIPTION], [], []]);
  });

  test('dedupe memory is bounded to a fixed number of store keys', async () => {
    const store = memoryStore();
    for (let index = 0; index < 20000; index++) {
      await newSubscriberCreatedTrigger.run(hookContext({ store, body: { uid: `evt_${index}`, data: { id: index } } }));
    }
    const dedupeKeys = [...store.data.keys()].filter((key) => key.startsWith(`${KEY}-evt-`));
    expect(dedupeKeys.length).toBeGreaterThan(0);
    expect(dedupeKeys.length).toBeLessThanOrEqual(8192);
    expect(store.data.has(`${KEY}-seen-events`)).toBe(false);
    expect(await newSubscriberCreatedTrigger.run(hookContext({ store, body: { uid: 'evt_19999', data: { id: 19999 } } }))).toEqual([]);
  });

  test('onDisable also removes the legacy dedupe list', async () => {
    const store = memoryStore({ initial: { [KEY]: 'ep_1', [`${KEY}-seen-events`]: ['evt_1'] } });
    stubBeehiiv({ replies: [{ status: 204 }] });
    await newSubscriberCreatedTrigger.onDisable(hookContext({ store }));
    expect(store.data.has(KEY)).toBe(false);
    expect(store.data.has(`${KEY}-seen-events`)).toBe(false);
  });

  test('a body without data emits nothing', async () => {
    expect(await newSubscriberCreatedTrigger.run(hookContext({ store: memoryStore(), body: 'not json' }))).toEqual([]);
  });

  test('User Unsubscribes test() reads the newest inactive subscriptions', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [SUBSCRIPTION], has_more: false, next_cursor: null } }] });
    const result = await userUnsubscribesTrigger.test(hookContext({ store: memoryStore() }));
    expect(seen[0].query.get('status')).toBe('inactive');
    expect(result).toEqual([SUBSCRIPTION]);
  });

  test('New Post Sent test() reads the newest confirmed posts', async () => {
    const seen = stubBeehiiv({ replies: [{ body: { data: [{ id: 'post_1' }], total_pages: 1 } }] });
    expect(await newPostSentTrigger.test(hookContext({ store: memoryStore() }))).toEqual([{ id: 'post_1' }]);
    expect(seen[0].query.get('status')).toBe('confirmed');
    expect(seen[0].query.get('order_by')).toBe('publish_date');
  });
});
