import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createSubscriptionTrigger } from './subscription-trigger';
import { memStore, oauth, stubHttp } from './test-support/http-stub';

afterEach(() => vi.restoreAllMocks());

const STORE_KEY = 'ringcentral_test_events_subscription_id';

const trigger = createSubscriptionTrigger<{ id?: string | number; kind?: string }>({
  name: 'test_events',
  displayName: 'Test Events',
  description: 'Fixture trigger for the factory.',
  eventFilters: ['/restapi/v1.0/test/events'],
  accept: (body) => body.kind !== 'Rejected',
  sampleData: { id: 1 },
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = (over: Record<string, unknown> = {}): any => ({
  auth: oauth(),
  store: memStore(),
  webhookUrl: 'https://example.com/webhook/abc',
  payload: { headers: {}, body: {} },
  ...over,
});

describe('handshake', () => {
  it('echoes the Validation-Token header back', async () => {
    const res = await trigger.onHandshake(
      ctx({ payload: { headers: { 'validation-token': 'tok-1' }, body: {} } }),
    );
    expect(res).toEqual({ status: 200, headers: { 'Validation-Token': 'tok-1' } });
  });

  it('rejects a handshake without the header', async () => {
    const res = await trigger.onHandshake(ctx());
    expect(res.status).toBe(400);
  });
});

describe('lifecycle', () => {
  it('creates the subscription on enable and remembers its id', async () => {
    const stub = stubHttp();
    stub.route('/subscription', { id: 'sub-42' });
    const store = memStore();

    await trigger.onEnable(ctx({ store }));

    expect(stub.find('/subscription')?.body).toMatchObject({
      eventFilters: ['/restapi/v1.0/test/events'],
      deliveryMode: { address: 'https://example.com/webhook/abc' },
    });
    expect(await store.get(STORE_KEY)).toBe('sub-42');
  });

  it('deletes the subscription and the stored id on disable', async () => {
    const stub = stubHttp();
    stub.route('/subscription/sub-42', {});
    const store = memStore();
    await store.put(STORE_KEY, 'sub-42');

    await trigger.onDisable(ctx({ store }));

    expect(stub.find('/subscription/sub-42')?.method).toBe('DELETE');
    expect(await store.get(STORE_KEY)).toBeNull();
  });

  it('still clears the stored id when RingCentral already killed the subscription', async () => {
    const stub = stubHttp();
    stub.route('/subscription/sub-42', () => new Error('gone'));
    const store = memStore();
    await store.put(STORE_KEY, 'sub-42');

    await expect(trigger.onDisable(ctx({ store }))).resolves.not.toThrow();
    expect(await store.get(STORE_KEY)).toBeNull();
  });
});

describe('run', () => {
  const enabled = async () => {
    const store = memStore();
    await store.put(STORE_KEY, 'sub-42');
    return store;
  };

  const delivery = (body: unknown, subscriptionId = 'sub-42', uuid?: string) => ({
    payload: { headers: {}, body: { subscriptionId, uuid, body } },
  });

  it('drops a delivery whose subscription id is not ours', async () => {
    const store = await enabled();
    // RingCentral does not sign deliveries, so the minted id is the only authenticity check.
    const out = await trigger.run(ctx({ store, ...delivery({ id: 7 }, 'sub-FORGED') }));
    expect(out).toEqual([]);
  });

  it('drops everything when no subscription id is stored at all', async () => {
    const out = await trigger.run(ctx({ ...delivery({ id: 7 }) }));
    expect(out).toEqual([]);
  });

  it('drops a delivery the accept predicate rejects', async () => {
    const store = await enabled();
    const out = await trigger.run(ctx({ store, ...delivery({ id: 7, kind: 'Rejected' }) }));
    expect(out).toEqual([]);
  });

  it('keys accepted events by their id for platform dedupe', async () => {
    const store = await enabled();
    const out = await trigger.run(ctx({ store, ...delivery({ id: 7, kind: 'Fine' }) }));
    expect(out).toEqual([{ id: 7, kind: 'Fine', [DEDUPE_KEY_PROPERTY]: '7' }]);
  });

  it('falls back to the delivery uuid when the body has no id', async () => {
    const store = await enabled();
    const out = await trigger.run(ctx({ store, ...delivery({ kind: 'Fine' }, 'sub-42', 'u-9') }));
    expect(out).toEqual([{ kind: 'Fine', [DEDUPE_KEY_PROPERTY]: 'u-9' }]);
  });

  it('emits an id-less event un-keyed rather than keying every one to the same constant', async () => {
    const store = await enabled();
    const out = await trigger.run(ctx({ store, ...delivery({ kind: 'Fine' }) }));
    // A constant key ('') would make the platform swallow every later id-less event as a duplicate.
    expect(out).toEqual([{ kind: 'Fine' }]);
    expect(Object.prototype.hasOwnProperty.call(out[0], DEDUPE_KEY_PROPERTY)).toBe(false);
  });

  it('drops a delivery with no body', async () => {
    const store = await enabled();
    const out = await trigger.run(
      ctx({ store, payload: { headers: {}, body: { subscriptionId: 'sub-42' } } }),
    );
    expect(out).toEqual([]);
  });
});
