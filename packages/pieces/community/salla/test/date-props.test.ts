import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { createCustomerAction } from '../src/lib/actions/create-customer';
import { createProductAction } from '../src/lib/actions/create-product';
import { updateCustomerAction } from '../src/lib/actions/update-customer';
import { updateProductPriceAction } from '../src/lib/actions/update-product-price';
import { updateProductAction } from '../src/lib/actions/update-product';

const auth = { access_token: 'token' };

const LATE_EVENING = '2026-11-30T22:00:00.000Z';
const LATE_EVENING_START = '2026-11-29T23:30:00.000Z';

type RunnableAction = { run: (context: never) => Promise<unknown> };

async function sentBody({ action, propsValue }: { action: RunnableAction; propsValue: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const spy = vi
    .spyOn(httpClient, 'sendRequest')
    .mockResolvedValue({ status: 200, headers: {}, body: { data: { id: 7, name: 'Item', sku: 'SKU-1', price: { amount: 10 } } } });
  await action.run({ auth, propsValue } as never);
  const write = spy.mock.calls.map(([request]) => request as HttpRequest).find((request) => request.method !== HttpMethod.GET);
  expect(write).toBeDefined();
  return (write?.body ?? {}) as Record<string, unknown>;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('store-local dates entered after 21:00 keep their calendar day', () => {
  it('Create Product', async () => {
    const body = await sentBody({
      action: createProductAction,
      propsValue: { name: 'Item', product_type: 'product', price: 10, sale_price: 8, sale_start: LATE_EVENING_START, sale_end: LATE_EVENING },
    });
    expect(body).toMatchObject({ sale_start: '2026-11-29', sale_end: '2026-11-30' });
  });

  it('Update Product', async () => {
    const body = await sentBody({
      action: updateProductAction,
      propsValue: { find_by: 'id', product: '7', sale_price: 8, sale_start: LATE_EVENING_START, sale_end: LATE_EVENING },
    });
    expect(body).toMatchObject({ sale_start: '2026-11-29', sale_end: '2026-11-30' });
  });

  it('Update Product Price', async () => {
    const body = await sentBody({
      action: updateProductPriceAction,
      propsValue: { sku: 'SKU-1', price: 10, sale_price: 8, sale_end: LATE_EVENING },
    });
    expect(body).toMatchObject({ sale_end: '2026-11-30' });
  });

  it('Create Customer', async () => {
    const body = await sentBody({
      action: createCustomerAction,
      propsValue: { first_name: 'Ali', last_name: 'Saleh', mobile: '+966501234567', birthday: LATE_EVENING },
    });
    expect(body).toMatchObject({ birthday: '2026-11-30' });
  });

  it('Update Customer', async () => {
    const body = await sentBody({
      action: updateCustomerAction,
      propsValue: { customer: '7', birthday: LATE_EVENING },
    });
    expect(body).toMatchObject({ birthday: '2026-11-30' });
  });
});
