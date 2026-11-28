import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, httpClient } from '@activepieces/pieces-common';
import { CreateOrderInput, sallaOrders } from '../src/lib/common/orders';

const auth = { access_token: 'token' };

const NO_DELIVERY_MESSAGE = 'المنتجات لا تتطلب الشحن أو الاستلام من فرع';

function rejectWith({ status, fields }: { status: number; fields: Record<string, string[]> }) {
  vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
    new HttpError({}, { status, responseBody: { status, success: false, error: { code: 'error', message: 'alert.invalid_fields', fields } } }),
  );
}

function orderInput(overrides: { deliveryMethod?: 'shipping' | 'pickup'; branchId?: number }): CreateOrderInput {
  return {
    customer: { id: 42 },
    payment: { status: 'paid' },
    products: [{ identifier: 1764656014, identifierType: 'id', quantity: 1 }],
    ...overrides,
  };
}

async function errorOf(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof Error) {
      return error;
    }
  }
  throw new Error('expected a rejection');
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Create Order on products that need no delivery', () => {
  it('explains to leave Delivery Method and Branch empty and keeps Salla\'s message', async () => {
    const cases: Array<{ deliveryMethod?: 'shipping' | 'pickup'; branchId?: number }> = [{ deliveryMethod: 'shipping' }, { branchId: 7 }];
    for (const overrides of cases) {
      rejectWith({ status: 422, fields: { products: [NO_DELIVERY_MESSAGE] } });
      const error = await errorOf(sallaOrders.createOrder({ auth, input: orderInput(overrides) }));
      expect(error.message).toContain('These products need no delivery: leave Delivery Method and Branch empty.');
      expect(error.message).toContain(NO_DELIVERY_MESSAGE);
      vi.restoreAllMocks();
    }
  });

  it('keeps the plain Salla error when no delivery field was sent', async () => {
    rejectWith({ status: 422, fields: { products: [NO_DELIVERY_MESSAGE] } });
    const error = await errorOf(sallaOrders.createOrder({ auth, input: orderInput({}) }));
    expect(error.message).not.toContain('leave Delivery Method and Branch empty');
    expect(error.message).toContain(NO_DELIVERY_MESSAGE);
  });

  it('also explains it when Salla answers in English', async () => {
    rejectWith({ status: 422, fields: { products: ['Products do not require shipping or receive from a branch'] } });
    const error = await errorOf(sallaOrders.createOrder({ auth, input: orderInput({ branchId: 7 }) }));
    expect(error.message).toContain('These products need no delivery');
  });

  it('keeps the plain Salla error for another products error, such as no stock', async () => {
    rejectWith({ status: 422, fields: { products: ['الكمية المطلوبة غير متوفرة'] } });
    const error = await errorOf(sallaOrders.createOrder({ auth, input: orderInput({ deliveryMethod: 'shipping' }) }));
    expect(error.message).not.toContain('need no delivery');
    expect(error.message).toContain('الكمية المطلوبة غير متوفرة');
  });

  it('keeps the plain Salla error for other field errors', async () => {
    rejectWith({ status: 422, fields: { 'customer.mobile': ['invalid mobile'] } });
    const error = await errorOf(sallaOrders.createOrder({ auth, input: orderInput({ deliveryMethod: 'shipping' }) }));
    expect(error.message).not.toContain('leave Delivery Method and Branch empty');
    expect(error.message).toContain('invalid mobile');
  });
});
