import crypto from 'crypto';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { square } from '../src';
import { triggers } from '../src/lib/triggers';
import { squareSamples } from '../src/lib/triggers/samples';
import { connection, memoryStore, stubFetch } from './helpers';

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

  test('keeps the dedupe list bounded', async () => {
    const store = memoryStore();
    const t = trigger('new_payment');
    for (let i = 0; i < 520; i++) {
      await t.run(runContext({ body: { ...squareSamples.new_payment, event_id: `e${i}` }, store }));
    }
    const stored = await store.get<unknown[]>('square_recent_event_ids');
    expect(stored?.length).toBe(500);
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
    expect(await t.run(runContext({ body: squareSamples.order_updated }))).toEqual([squareSamples.order_updated]);
    expect(seen).toHaveLength(0);
  });

  test('order samples use the real data.type values', () => {
    expect(squareSamples.new_order.data.type).toBe('order_created');
    expect(squareSamples.order_updated.data.type).toBe('order_updated');
  });
});
