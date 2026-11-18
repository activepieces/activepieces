import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { recordCartAction } from '../src/lib/actions/record-cart.action';
import { recordEventAction } from '../src/lib/actions/record-event.action';
import { recordOrderAction } from '../src/lib/actions/record-order.action';
import { run, stubFetch } from './helpers';

const A = '4617837';
const EMAIL = 'odai+aptest-1@activepieces.com';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('record_event', () => {
  test('posts one event with normalised time', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    const result = await run(recordEventAction)({ accountId: A, subscriber: EMAIL, action: 'Logged in', properties: { plan: 'pro' }, occurredAt: '2026-10-06T10:00:00.000Z' });
    expect(seen[0].path).toBe(`/${A}/events`);
    expect(seen[0].body).toEqual({ events: [{ email: EMAIL, action: 'Logged in', properties: { plan: 'pro' }, occurred_at: '2026-10-06T10:00:00Z' }] });
    expect(result).toEqual({ subscriber: EMAIL, action: 'Logged in', occurredAt: '2026-10-06T10:00:00Z', recorded: true });
  });
  test('uses id for non-email subscribers and validates the action length', async () => {
    const seen = stubFetch(() => ({ status: 204 }));
    await run(recordEventAction)({ accountId: A, subscriber: 'z1tog', action: 'x' });
    expect(seen[0].body).toEqual({ events: [{ id: 'z1tog', action: 'x' }] });
    await expect(run(recordEventAction)({ accountId: A, subscriber: 'z1tog', action: 'x'.repeat(256) })).rejects.toThrow('255');
  });
});

describe('shopper activity', () => {
  test('record_order posts to v3 with only the given fields', async () => {
    const seen = stubFetch(() => ({ status: 202, body: { request_id: 'req-1' } }));
    const result = await run(recordOrderAction)({
      accountId: A,
      action: 'placed',
      orderId: 'aptest-1',
      email: EMAIL,
      provider: 'activepieces_test',
      initialStatus: 'unsubscribed',
      grandTotal: '10.5',
      currency: 'usd',
      items: [{ name: 'Bottle', price: 5.25, quantity: 2 }],
    });
    expect(seen[0].url).toBe(`https://api.getdrip.com/v3/${A}/shopper_activity/order`);
    expect(seen[0].body).toEqual({
      email: EMAIL,
      provider: 'activepieces_test',
      action: 'placed',
      order_id: 'aptest-1',
      initial_status: 'unsubscribed',
      grand_total: 10.5,
      currency: 'USD',
      items: [{ name: 'Bottle', price: 5.25, quantity: 2 }],
    });
    expect(result).toEqual({ requestId: 'req-1', orderId: 'aptest-1', action: 'placed', accepted: true });
  });
  test('record_order validates person, provider, currency, amounts and items before the request', async () => {
    const seen = stubFetch(() => ({ status: 202, body: {} }));
    const base = { accountId: A, action: 'placed', orderId: 'o', email: EMAIL, provider: 'p' };
    await expect(run(recordOrderAction)({ ...base, email: undefined })).rejects.toThrow('Customer Email or Drip Person ID');
    await expect(run(recordOrderAction)({ ...base, provider: 'My Store' })).rejects.toThrow('snake_case');
    await expect(run(recordOrderAction)({ ...base, currency: 'dollars' })).rejects.toThrow('ISO 4217');
    await expect(run(recordOrderAction)({ ...base, grandTotal: -1 })).rejects.toThrow('Grand Total');
    await expect(run(recordOrderAction)({ ...base, items: [{ price: 1 }] })).rejects.toThrow('missing name');
    await expect(run(recordOrderAction)({ ...base, items: [{ name: 'x', price: 'abc' }] })).rejects.toThrow('price must be a number');
    expect(seen).toHaveLength(0);
  });
  test('person ID wins over email', async () => {
    const seen = stubFetch(() => ({ status: 202, body: { request_id: 'r' } }));
    await run(recordOrderAction)({ accountId: A, action: 'paid', orderId: 'o', email: EMAIL, personId: 'p1', provider: 'p' });
    expect(seen[0].body).toMatchObject({ person_id: 'p1' });
    expect(seen[0].body).not.toHaveProperty('email');
  });
  test('record_cart requires the cart url and full item fields', async () => {
    const seen = stubFetch(() => ({ status: 202, body: { request_ids: ['r2'] } }));
    const item = { product_id: 'B1', product_variant_id: 'B1', name: 'Bottle', price: 1 };
    await expect(run(recordCartAction)({ accountId: A, action: 'created', cartId: 'c1', cartUrl: 'https://s.example/cart/c1', email: EMAIL, provider: 'p', items: [item] })).resolves.toEqual({
      requestId: 'r2',
      cartId: 'c1',
      action: 'created',
      accepted: true,
    });
    expect(seen[0].url).toBe(`https://api.getdrip.com/v3/${A}/shopper_activity/cart`);
    expect(seen[0].body).toEqual({ email: EMAIL, provider: 'p', action: 'created', cart_id: 'c1', cart_url: 'https://s.example/cart/c1', items: [item] });
    await expect(run(recordCartAction)({ accountId: A, action: 'created', cartId: 'c1', email: EMAIL, provider: 'p' })).rejects.toThrow('Cart URL');
    await expect(run(recordCartAction)({ accountId: A, action: 'created', cartId: 'c1', cartUrl: 'u', email: EMAIL, provider: 'p', items: [{ name: 'x' }] })).rejects.toThrow('product_id');
  });
});
