import crypto from 'crypto';
import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { square } from '../src';
import { triggers } from '../src/lib/triggers';
import { squareSamples } from '../src/lib/triggers/samples';
import { connection, memoryStore, stubFetch, TOKEN } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

function trigger(name: string) {
  const found = triggers.find((item) => item.name === name);
  if (!found) {
    throw new Error(`missing trigger ${name}`);
  }
  return found;
}

function runContext({ body, propsValue = {}, store = memoryStore() }: { body: unknown; propsValue?: Record<string, unknown>; store?: ReturnType<typeof memoryStore> }) {
  return { auth: connection(), propsValue, store, payload: { body, headers: {}, queryParams: {} } };
}

describe('custom api call', () => {
  function customCall() {
    const found = square.actions()['custom_api_call'];
    if (!found) {
      throw new Error('missing custom_api_call');
    }
    return found;
  }
  const call = (url: string) =>
    customCall().run({ auth: connection(), propsValue: { url: { url }, method: 'GET', headers: {}, queryParams: {}, failsafe: false }, store: memoryStore() });

  test.each([
    'https://evil.example.com/v2/locations',
    'https://connect.squareup.com.evil.io/v2/locations',
    'http://connect.squareup.com/v2/locations',
    'https://user@connect.squareup.com/v2/locations',
    'https://connect.squareup.com:8443/v2/locations',
    'HTTPS://evil.example.com/v2',
  ])('refuses to send the token to %s', async (url) => {
    const seen = stubFetch(() => ({ body: {} }));
    await expect(call(url)).rejects.toThrow('only sends the Square token');
    expect(seen).toHaveLength(0);
  });

  test.each(['/v2/locations', 'https://connect.squareup.com/v2/locations'])('sends %s to Square with the token', async (url) => {
    const seen = stubFetch(() => ({ body: { locations: [] } }));
    await call(url);
    expect(seen[0].url.startsWith('https://connect.squareup.com/v2/locations')).toBe(true);
    expect(seen[0].headers.get('authorization')).toBe(`Bearer ${TOKEN}`);
  });
});

describe('webhook signature', () => {
  const secret = 'sig-key';
  const url = 'https://cloud.example.com/api/v1/app-events/square';
  const rawBody = '{"type":"customer.created","merchant_id":"M1"}';
  const good = crypto.createHmac('sha256', secret).update(url + rawBody).digest('base64');
  const verify = (signature: unknown) =>
    square.events?.verify({ webhookSecret: secret, appWebhookUrl: url, payload: { body: JSON.parse(rawBody), rawBody, headers: { 'x-square-hmacsha256-signature': signature }, queryParams: {} } });

  test('accepts the right signature and rejects others', () => {
    expect(verify(good)).toBe(true);
    expect(verify(good.slice(0, -2) + 'AA')).toBe(false);
    expect(verify('short')).toBe(false);
    expect(verify(undefined)).toBe(false);
    expect(verify([good])).toBe(true);
  });

  test('parseAndReply routes by event type and merchant', () => {
    expect(square.events?.parseAndReply({ payload: { body: { type: 'order.created', merchant_id: 'M1' }, headers: {}, queryParams: {} } })).toEqual({ event: 'order.created', identifierValue: 'M1' });
  });
});

describe('trigger runs', () => {
  test('dedupes a retried delivery by event_id', async () => {
    const store = memoryStore();
    const t = trigger('new_customer');
    expect(await t.run(runContext({ body: squareSamples.new_customer, store }))).toHaveLength(1);
    expect(await t.run(runContext({ body: squareSamples.new_customer, store }))).toHaveLength(0);
    expect(await t.run(runContext({ body: { ...squareSamples.new_customer, event_id: 'other' }, store }))).toHaveLength(1);
  });

  test('a job retried after its claim expires emits the delivery again', async () => {
    const store = memoryStore();
    const t = trigger('new_customer');
    const start = Date.now();
    expect(await t.run(runContext({ body: squareSamples.new_customer, store }))).toHaveLength(1);
    vi.spyOn(Date, 'now').mockReturnValue(start + 8 * 60 * 1000);
    try {
      const retried = await t.run(runContext({ body: squareSamples.new_customer, store }));
      expect(retried).toHaveLength(1);
      expect(retried[0]).toMatchObject({ _dedupe_key: `square:${squareSamples.new_customer.event_id}` });
    } finally {
      vi.restoreAllMocks();
    }
  });

  test('keeps the dedupe state bounded', async () => {
    const store = memoryStore();
    const t = trigger('new_payment');
    for (let i = 0; i < 700; i++) {
      await t.run(runContext({ body: { ...squareSamples.new_payment, event_id: `e${i}` }, store }));
    }
    const sizes = await Promise.all(Array.from({ length: 64 }, (_, slot) => store.get<unknown[]>(`square_seen_events_${slot}`)));
    expect(sizes.every((entries) => (entries?.length ?? 0) <= 100)).toBe(true);
    expect(await store.get('square_seen_events_64')).toBeNull();
  });

  test('a failed order read does not mark the event as seen', async () => {
    const store = memoryStore();
    const seen = stubFetch((_request, index) =>
      index === 0 ? { status: 500, body: { errors: [{ code: 'INTERNAL_SERVER_ERROR' }] } } : { body: { order: { id: 'eA3vssLHKJrv9H0IdJCM3gNqfdcZY', state: 'OPEN' } } },
    );
    const t = trigger('new_order');
    const props = { include_full_order: true };
    await expect(t.run(runContext({ body: squareSamples.new_order, propsValue: props, store }))).rejects.toThrow('500');
    expect(await t.run(runContext({ body: squareSamples.new_order, propsValue: props, store }))).toHaveLength(1);
    expect(await t.run(runContext({ body: squareSamples.new_order, propsValue: props, store }))).toHaveLength(0);
    expect(seen).toHaveLength(2);
  });

  test('a delivery in progress blocks a concurrent copy until its claim goes stale', async () => {
    const store = memoryStore();
    const t = trigger('new_customer');
    const eventId = squareSamples.new_customer.event_id;
    const slotKeys = Array.from({ length: 64 }, (_, slot) => `square_seen_events_${slot}`);
    const now = Date.now();
    await Promise.all(slotKeys.map((key) => store.put(key, [{ id: eventId, at: now, token: 'other-job', done: false }])));
    expect(await t.run(runContext({ body: squareSamples.new_customer, store }))).toHaveLength(0);
    const stale = now - 3 * 60 * 1000;
    await Promise.all(slotKeys.map((key) => store.put(key, [{ id: eventId, at: stale, token: 'crashed-job', done: false }])));
    expect(await t.run(runContext({ body: squareSamples.new_customer, store }))).toHaveLength(1);
  });

  test('different events sharing a slot keep each other', async () => {
    const store = memoryStore();
    const t = trigger('new_payment');
    const ids = Array.from({ length: 200 }, (_, i) => `evt-${i}`);
    for (const id of ids) {
      await t.run(runContext({ body: { ...squareSamples.new_payment, event_id: id }, store }));
    }
    const replays = await Promise.all(ids.map((id) => t.run(runContext({ body: { ...squareSamples.new_payment, event_id: id }, store }))));
    expect(replays.every((events) => events.length === 0)).toBe(true);
  });

  test('every emitted event carries the platform dedupe key square:<event_id>', async () => {
    stubFetch(() => ({ body: { order: { id: 'eA3vssLHKJrv9H0IdJCM3gNqfdcZY', state: 'OPEN' } } }));
    const cases: { name: string; body: { event_id: string }; propsValue: Record<string, unknown> }[] = [
      { name: 'new_customer', body: squareSamples.new_customer, propsValue: {} },
      { name: 'new_payment', body: squareSamples.new_payment, propsValue: {} },
      { name: 'new_order', body: squareSamples.new_order, propsValue: { include_full_order: true } },
    ];
    for (const { name, body, propsValue } of cases) {
      const events = await trigger(name).run(runContext({ body, propsValue }));
      expect(events).toHaveLength(1);
      expect(Reflect.get(Object(events[0]), DEDUPE_KEY_PROPERTY)).toBe(`square:${body.event_id}`);
    }
    const noId = await trigger('new_customer').run(runContext({ body: { ...squareSamples.new_customer, event_id: undefined } }));
    expect(Object.keys(Object(noId[0]))).not.toContain(DEDUPE_KEY_PROPERTY);
  });

  test('sample data and output schemas do not carry the dedupe key', () => {
    for (const t of triggers) {
      expect(JSON.stringify(t.sampleData)).not.toContain(DEDUPE_KEY_PROPERTY);
      expect(JSON.stringify(t.outputSchema ?? {})).not.toContain(DEDUPE_KEY_PROPERTY);
    }
  });

  test('location filter drops events from other locations', async () => {
    const t = trigger('new_payment');
    expect(await t.run(runContext({ body: squareSamples.new_payment, propsValue: { location_id: 'OTHER' } }))).toHaveLength(0);
    expect(await t.run(runContext({ body: squareSamples.new_payment, propsValue: { location_id: 'S8GWD5R9QB376' } }))).toHaveLength(1);
  });

  test('include full order adds the fetched order, drops unknown orders', async () => {
    const seen = stubFetch((request) =>
      request.path.endsWith('missing')
        ? { status: 404, body: { errors: [{ code: 'NOT_FOUND' }] } }
        : { body: { order: { id: 'eA3vssLHKJrv9H0IdJCM3gNqfdcZY', state: 'OPEN', total_money: { amount: 900, currency: 'USD' } } } },
    );
    const t = trigger('new_order');
    const [event] = await t.run(runContext({ body: squareSamples.new_order, propsValue: { include_full_order: true } }));
    expect(seen[0].path).toBe('/v2/orders/eA3vssLHKJrv9H0IdJCM3gNqfdcZY');
    expect(event).toMatchObject({ type: 'order.created', order: { id: 'eA3vssLHKJrv9H0IdJCM3gNqfdcZY', total: '9.00' } });
    const forged = { ...squareSamples.new_order, event_id: 'forged', data: { ...squareSamples.new_order.data, id: 'missing' } };
    expect(await t.run(runContext({ body: forged, propsValue: { include_full_order: true } }))).toHaveLength(0);
  });

  test('without the opt-in the order payload is unchanged and nothing is fetched', async () => {
    const seen = stubFetch(() => ({ body: {} }));
    const t = trigger('order_updated');
    expect(await t.run(runContext({ body: squareSamples.order_updated }))).toEqual([{ ...squareSamples.order_updated, [DEDUPE_KEY_PROPERTY]: `square:${squareSamples.order_updated.event_id}` }]);
    expect(seen).toHaveLength(0);
  });

  test('order samples use the real data.type values', () => {
    expect(squareSamples.new_order.data.type).toBe('order_created');
    expect(squareSamples.order_updated.data.type).toBe('order_updated');
  });
});
