import { afterEach, describe, expect, test, vi } from 'vitest';
import { adjustInventoryByIdAction } from '../src/lib/actions/ai/adjust-inventory-by-id';
import { createOrderByIdAction } from '../src/lib/actions/ai/create-order-by-id';
import { updateCustomerByIdAction } from '../src/lib/actions/ai/update-customer-by-id';
import { updateItemVariationPriceByIdAction } from '../src/lib/actions/ai/update-item-variation-price-by-id';
import { createCatalogItemAction } from '../src/lib/actions/create-catalog-item';
import { createCustomerAction } from '../src/lib/actions/create-customer';
import { createOrderAction } from '../src/lib/actions/create-order';
import { findCustomersAction } from '../src/lib/actions/find-customers';
import { recordExternalPaymentAction } from '../src/lib/actions/record-external-payment';
import { refundPaymentAction } from '../src/lib/actions/refund-payment';
import { searchOrdersByIdAction } from '../src/lib/actions/ai/search-orders-by-id';
import { squareProps } from '../src/lib/common/props';
import { connection, context, LOCATION, stubFetch } from './helpers';

afterEach(() => {
  vi.unstubAllGlobals();
});

const customer = { customer: { id: 'C1', given_name: 'Ada', version: 3, email_address: 'ada@example.com' } };

describe('customers', () => {
  test('create sends fields plus an idempotency key', async () => {
    const seen = stubFetch(() => ({ body: customer }));
    const props = { given_name: ' Ada ', email_address: 'ada@example.com', city: 'Oakland' };
    const first = await createCustomerAction.run(context(props));
    expect(seen[0].method).toBe('POST');
    expect(seen[0].path).toBe('/v2/customers');
    expect(seen[0].json).toMatchObject({ given_name: 'Ada', email_address: 'ada@example.com', address: { locality: 'Oakland' } });
    expect(Reflect.get(Object(seen[0].json), 'idempotency_key')).toEqual(expect.any(String));
    expect(first).toMatchObject({ id: 'C1', given_name: 'Ada' });
  });

  test('create refuses an empty profile before any request', async () => {
    const seen = stubFetch(() => ({ body: customer }));
    await expect(createCustomerAction.run(context({ note: 'only a note' }))).rejects.toThrow('Fill at least one');
    await expect(createCustomerAction.run(context({ email_address: 'not-an-email' }))).rejects.toThrow('not a valid email');
    expect(seen).toHaveLength(0);
  });

  test('update sends only filled fields, nulls for cleared fields, and the current version', async () => {
    const seen = stubFetch(() => ({ body: customer }));
    await updateCustomerByIdAction.run(context({ customer_id: 'C1', company_name: 'Acme', clear_fields: ['note', 'company_name', 'bogus'] }));
    expect(seen.map((request) => request.method)).toEqual(['GET', 'PUT']);
    expect(seen[1].json).toEqual({ note: null, company_name: 'Acme', version: 3 });
  });

  test('update with nothing to change fails without a request', async () => {
    const seen = stubFetch(() => ({ body: customer }));
    await expect(updateCustomerByIdAction.run(context({ customer_id: 'C1' }))).rejects.toThrow('Nothing to update');
    expect(seen).toHaveLength(0);
  });

  test('find builds an exact or fuzzy filter and returns a page', async () => {
    const seen = stubFetch(() => ({ body: { customers: [customer.customer], cursor: 'NEXT' } }));
    const result = await findCustomersAction.run(context({ email_address: 'ada@', match: 'fuzzy', limit: 500 }));
    expect(seen[0].json).toEqual({ query: { filter: { email_address: { fuzzy: 'ada@' } }, sort: { field: 'CREATED_AT', order: 'DESC' } }, limit: 100 });
    expect(result).toMatchObject({ count: 1, has_more: true, next_cursor: 'NEXT' });
  });
});

describe('catalog', () => {
  test('create item converts the price with string math and uses temporary ids', async () => {
    const seen = stubFetch((request) =>
      request.path === '/v2/locations/main' ? { body: LOCATION } : { body: { catalog_object: { id: 'I1', type: 'ITEM', item_data: { name: 'Tea', variations: [] } } } },
    );
    await createCatalogItemAction.run(context({ name: 'Tea', price: '19.99', sku: 'T-1' }));
    const object = Reflect.get(Object(seen[1].json), 'object');
    expect(object).toMatchObject({
      type: 'ITEM',
      id: '#item',
      item_data: { name: 'Tea', variations: [{ id: '#variation', item_variation_data: { item_id: '#item', name: 'Regular', sku: 'T-1', pricing_type: 'FIXED_PRICING', price_money: { amount: 1999, currency: 'USD' } } }] },
    });
  });

  test('variation price update reads the object and upserts it with its version', async () => {
    const variation = { id: 'V1', type: 'ITEM_VARIATION', version: 77, item_variation_data: { item_id: 'I1', name: 'Large', price_money: { amount: 450, currency: 'USD' } } };
    const seen = stubFetch((request) => (request.method === 'GET' ? { body: { object: variation } } : { body: { catalog_object: { ...variation, version: 78 } } }));
    await updateItemVariationPriceByIdAction.run(context({ variation_id: 'V1', price: '5.25' }));
    expect(seen[1].json).toMatchObject({ object: { id: 'V1', version: 77, item_variation_data: { name: 'Large', pricing_type: 'FIXED_PRICING', price_money: { amount: 525, currency: 'USD' } } } });
  });
});

describe('inventory', () => {
  test('adjust maps the reason to Square states and keeps the key stable across retries', async () => {
    const seen = stubFetch((_request, index) => (index === 0 ? { status: 503, body: { errors: [{ code: 'SERVICE_UNAVAILABLE' }] } } : { body: { counts: [{ catalog_object_id: 'V1', location_id: 'L1', state: 'IN_STOCK', quantity: '7' }] } }));
    const props = { variation_id: 'V1', location_id: 'L1', reason: 'SOLD', quantity: '2' };
    await expect(adjustInventoryByIdAction.run(context(props))).rejects.toThrow('503');
    const result = await adjustInventoryByIdAction.run(context(props));
    const body = Object(seen[0].json);
    expect(Reflect.get(body, 'changes')[0]).toMatchObject({ type: 'ADJUSTMENT', adjustment: { from_state: 'IN_STOCK', to_state: 'SOLD', quantity: '2', catalog_object_id: 'V1', from_location_id: 'L1', to_location_id: 'L1' } });
    expect(Reflect.get(body, 'idempotency_key')).toBe(Reflect.get(Object(seen[1].json), 'idempotency_key'));
    expect(result.items[0]).toMatchObject({ variation_id: 'V1', quantity: '7' });
  });
});

describe('orders', () => {
  test('creates an order from catalog and custom line items in the location currency', async () => {
    const seen = stubFetch((request) => (request.method === 'GET' ? { body: LOCATION } : { body: { order: { id: 'O1', total_money: { amount: 1380, currency: 'USD' } } } }));
    const result = await createOrderByIdAction.run(
      context({ line_items: [{ variation_id: 'V1', quantity: '2' }, { name: 'Custom', price: '1.10', quantity: '3' }], customer_id: 'C1' }),
    );
    expect(seen[0].path).toBe('/v2/locations/main');
    expect(seen[1].json).toMatchObject({
      order: {
        location_id: 'LOC1',
        customer_id: 'C1',
        line_items: [
          { catalog_object_id: 'V1', quantity: '2' },
          { name: 'Custom', quantity: '3', base_price_money: { amount: 110, currency: 'USD' } },
        ],
      },
    });
    expect(result).toMatchObject({ id: 'O1', total: '13.80', total_minor: 1380 });
  });

  test('human create order reads the dynamic line items', async () => {
    const seen = stubFetch((request) => (request.method === 'GET' ? { body: LOCATION } : { body: { order: { id: 'O2' } } }));
    await createOrderAction.run(context({ line_items: { items: [{ name: 'Cake', price: '0.99' }] } }));
    expect(Reflect.get(Object(seen[1].json), 'order')).toMatchObject({ line_items: [{ name: 'Cake', quantity: '1', base_price_money: { amount: 99 } }] });
  });

  test('rejects fractional quantities and incomplete custom items', async () => {
    stubFetch(() => ({ body: LOCATION }));
    await expect(createOrderByIdAction.run(context({ line_items: [{ name: 'x', price: '1', quantity: '1.5' }] }))).rejects.toThrow('whole number');
    await expect(createOrderByIdAction.run(context({ line_items: [{ name: 'x' }] }))).rejects.toThrow('give both a name and a price');
  });

  test('search defaults to all active locations and sorts newest first', async () => {
    const seen = stubFetch((request) =>
      request.method === 'GET'
        ? { body: { locations: [{ id: 'A', status: 'ACTIVE' }, { id: 'B', status: 'INACTIVE' }] } }
        : { body: { orders: [], cursor: undefined } },
    );
    await searchOrdersByIdAction.run(context({ states: ['OPEN'], created_after: '2026-10-01T00:00:00Z' }));
    expect(seen[1].json).toEqual({
      location_ids: ['A'],
      limit: 50,
      return_entries: false,
      query: { filter: { state_filter: { states: ['OPEN'] }, date_time_filter: { created_at: { start_at: '2026-10-01T00:00:00.000Z' } } }, sort: { sort_field: 'CREATED_AT', sort_order: 'DESC' } },
    });
  });
});

describe('money actions', () => {
  test('record cash payment sends CASH details and never a card source', async () => {
    const seen = stubFetch((request) => (request.method === 'GET' ? { body: LOCATION } : { body: { payment: { id: 'P1', amount_money: { amount: 100, currency: 'USD' } } } }));
    await recordExternalPaymentAction.run(context({ source: 'CASH', amount: '1.00', note: 'cash' }));
    expect(seen[1].json).toMatchObject({ source_id: 'CASH', amount_money: { amount: 100, currency: 'USD' }, cash_details: { buyer_supplied_money: { amount: 100, currency: 'USD' } }, location_id: 'LOC1', autocomplete: true });
  });

  test('identical cash payments in one run share a key unless Idempotency Key separates them', async () => {
    const seen = stubFetch((request) => (request.method === 'GET' ? { body: LOCATION } : { body: { payment: { id: 'P1', amount_money: { amount: 1000, currency: 'USD' } } } }));
    await recordExternalPaymentAction.run(context({ source: 'CASH', amount: '10.00' }));
    await recordExternalPaymentAction.run(context({ source: 'CASH', amount: '10.00' }));
    await recordExternalPaymentAction.run(context({ source: 'CASH', amount: '10.00', idempotency_key: 'loop-item-1' }));
    await recordExternalPaymentAction.run(context({ source: 'CASH', amount: '10.00', idempotency_key: 'loop-item-2' }));
    const keys = seen.filter((request) => request.method === 'POST').map((request) => Reflect.get(Object(request.json), 'idempotency_key'));
    expect(keys[0]).toBe(keys[1]);
    expect(keys.slice(2)).toEqual(['loop-item-1', 'loop-item-2']);
  });

  test('external payment needs a type and source', async () => {
    stubFetch(() => ({ body: LOCATION }));
    await expect(recordExternalPaymentAction.run(context({ source: 'EXTERNAL', amount: '1.00' }))).rejects.toThrow('External Type is required');
  });

  test('refund maps Square over-refund errors to what is left to refund', async () => {
    stubFetch((request) =>
      request.method === 'GET'
        ? { body: { payment: { id: 'P1', total_money: { amount: 1000, currency: 'USD' }, refunded_money: { amount: 600, currency: 'USD' } } } }
        : { status: 400, body: { errors: [{ code: 'REFUND_AMOUNT_INVALID', detail: 'The requested refund amount exceeds the amount available to refund.' }] } },
    );
    await expect(refundPaymentAction.run(context({ payment_id: 'P1', amount: '4.01' }))).rejects.toThrow('4.00 USD left to refund');
  });

  test('refund retried after a lost response resends the same key even when nothing is left to refund', async () => {
    const full = { payment: { id: 'P1', total_money: { amount: 1000, currency: 'USD' } } };
    const refunded = { payment: { id: 'P1', total_money: { amount: 1000, currency: 'USD' }, refunded_money: { amount: 1000, currency: 'USD' } } };
    const seen = stubFetch((request, index) => {
      if (request.method === 'GET') {
        return { body: index === 0 ? full : refunded };
      }
      return index === 1 ? { status: 500, body: { errors: [{ code: 'INTERNAL_SERVER_ERROR' }] } } : { body: { refund: { id: 'R1', status: 'PENDING', amount_money: { amount: 1000, currency: 'USD' } } } };
    });
    await expect(refundPaymentAction.run(context({ payment_id: 'P1', amount: '10' }))).rejects.toThrow('500');
    const result = await refundPaymentAction.run(context({ payment_id: 'P1', amount: '10' }));
    const posts = seen.filter((request) => request.method === 'POST').map((request) => Reflect.get(Object(request.json), 'idempotency_key'));
    expect(posts).toHaveLength(2);
    expect(posts[0]).toBe(posts[1]);
    expect(result).toMatchObject({ id: 'R1' });
  });

  test('refund sends the exact amount in the payment currency', async () => {
    const seen = stubFetch((request) =>
      request.method === 'GET' ? { body: { payment: { id: 'P1', total_money: { amount: 1000, currency: 'USD' } } } } : { body: { refund: { id: 'R1', status: 'PENDING', amount_money: { amount: 400, currency: 'USD' } } } },
    );
    const result = await refundPaymentAction.run(context({ payment_id: 'P1', amount: '4', reason: 'test' }));
    expect(seen[1].path).toBe('/v2/refunds');
    expect(seen[1].json).toMatchObject({ payment_id: 'P1', amount_money: { amount: 400, currency: 'USD' }, reason: 'test' });
    expect(result).toMatchObject({ id: 'R1', amount: '4.00' });
  });
});

describe('dropdowns', () => {
  test('the variation dropdown lists every variation of a large item', async () => {
    const variations = Array.from({ length: 120 }, (_, i) => ({ id: `V${i}`, type: 'ITEM_VARIATION', item_variation_data: { item_id: 'I1', name: `Size ${i}` } }));
    stubFetch(() => ({ body: { object: { id: 'I1', type: 'ITEM', item_data: { name: 'Shirt', variations } } } }));
    const result = await squareProps.variation({ required: true }).options({ auth: connection(), item: 'I1' }, {});
    expect(result.options).toHaveLength(120);
    expect(result.options[119]).toMatchObject({ value: 'V119' });
  });
});
