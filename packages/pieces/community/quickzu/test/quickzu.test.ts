import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, httpClient } from '@activepieces/pieces-common';
import { aiCreateProductDiscountAction } from '../src/lib/actions/discounts/ai-create-product-discount';
import { aiCreatePromoCodeAction } from '../src/lib/actions/discounts/ai-create-promo-code';
import { orderCreatedTrigger } from '../src/lib/triggers/order-created';
import { quickzuAuth } from '../src/lib/auth';
import { toQuickzuDate } from '../src/lib/common';
import { QuickzuAPIClient } from '../src/lib/common/client';
import { quickzu } from '../src';
import { updateProductAction } from '../src/lib/actions/products/update-product';

function mockSend(body: unknown = { _id: 'd1' }) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body });
}

function actionContext(propsValue: Record<string, unknown>) {
  return { auth: { secret_text: 'tok', type: 'SECRET_TEXT' }, propsValue };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('piece metadata', () => {
  it('requires a release that hides ai atomics from the human picker', () => {
    const parts = String(quickzu.minimumSupportedRelease).split('.').map(Number);
    const floor = [0, 86, 3];
    const diff = parts.map((part, i) => part - floor[i]).find((d) => d !== 0) ?? 0;
    expect(diff).toBeGreaterThanOrEqual(0);
  });

  it('demotes the DynamicProperties discount actions and exposes ai twins', () => {
    const actions = quickzu.actions();
    expect(actions['quickzu_create_product_discount'].audience).toBe('human');
    expect(actions['quickzu_create_promo_code'].audience).toBe('human');
    expect(actions['ai_create_product_discount'].audience).toBe('ai');
    expect(actions['ai_create_promo_code'].audience).toBe('ai');
  });
});

describe('ai_create_product_discount', () => {
  it('sends an item-level discount with date-only values and product ids', async () => {
    const send = mockSend();
    const result = await aiCreateProductDiscountAction.run(
      actionContext({
        title: 'Sale',
        start_date: '2026-11-01T10:00:00.000Z',
        end_date: '2026-11-30',
        filter_type: 'PRODUCTS',
        product_ids: [' p1 ', 'p2', ''],
        type: 'PERCENTAGE',
        value: 10,
        is_enabled: true,
        is_visible: false,
      })
    );
    expect(result).toEqual({ _id: 'd1' });
    const request = send.mock.calls[0][0];
    expect(request.url).toBe('https://app.quickzu.com/api/seller/discounts');
    expect(request.headers).toMatchObject({ Authorization: 'tok' });
    expect(request.body).toEqual({
      discount_method: 'ITEM_LEVEL',
      title: 'Sale',
      start_date: '2026-11-01',
      end_date: '2026-11-30',
      filter_type: 'PRODUCTS',
      type: 'PERCENTAGE',
      value: 10,
      is_enabled: true,
      is_visible: false,
      selectedProducts: ['p1', 'p2'],
    });
  });

  it('refuses PRODUCTS scope without product ids and sends nothing', async () => {
    const send = mockSend();
    await expect(
      aiCreateProductDiscountAction.run(
        actionContext({
          title: 'Sale',
          start_date: '2026-11-01',
          end_date: '2026-11-30',
          filter_type: 'PRODUCTS',
          category_ids: ['c1'],
          type: 'FLAT',
          value: 5,
        })
      )
    ).rejects.toThrow('Product IDs must contain at least one ID');
    expect(send).not.toHaveBeenCalled();
  });

  it('rejects an unparseable date', async () => {
    const send = mockSend();
    await expect(
      aiCreateProductDiscountAction.run(
        actionContext({
          title: 'Sale',
          start_date: 'next friday',
          end_date: '2026-11-30',
          filter_type: 'ALL_PRODUCTS',
          type: 'FLAT',
          value: 5,
        })
      )
    ).rejects.toThrow('YYYY-MM-DD');
    expect(send).not.toHaveBeenCalled();
  });
});

describe('ai_create_promo_code', () => {
  it('sends a subtotal promo with category ids and limits', async () => {
    const send = mockSend();
    await aiCreatePromoCodeAction.run(
      actionContext({
        title: 'Promo',
        start_date: '2026-11-01',
        end_date: '2026-11-02',
        filter_type: 'CATEGORIES',
        category_ids: ['c1'],
        product_ids: ['ignored'],
        promo_code: 'SAVE10',
        minimum_cart_value: 50,
        max_users_limit: 100,
        type: 'FLAT',
        value: 10,
      })
    );
    expect(send.mock.calls[0][0].body).toEqual({
      discount_method: 'SUB_TOTAL',
      title: 'Promo',
      start_date: '2026-11-01',
      end_date: '2026-11-02',
      filter_type: 'CATEGORIES',
      promo_code: 'SAVE10',
      minimum_cart_value: 50,
      max_users_limit: 100,
      type: 'FLAT',
      value: 10,
      is_enabled: true,
      is_visible: true,
      selectedCategories: ['c1'],
    });
  });
});

describe('order created trigger', () => {
  it('emits the webhook body, not the request wrapper', async () => {
    const body = { payload: { id: 'o1' }, resource: 'order', operation: 'create' };
    const output = await orderCreatedTrigger.run({
      payload: { body, headers: { a: 'b' }, queryParams: {} },
    });
    expect(output).toEqual([body]);
  });
});

describe('auth validate', () => {
  it('accepts a token the categories endpoint accepts', async () => {
    const send = mockSend({ data: [], total: 0, success: true });
    const result = await quickzuAuth.validate?.({ auth: 'tok', server: { apiUrl: '', publicUrl: '' } });
    expect(result).toEqual({ valid: true });
    expect(send.mock.calls[0][0].url).toBe('https://app.quickzu.com/api/seller/categories');
  });

  it('rejects a token the API refuses', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({ secret: 'x' }, { status: 401, responseBody: { message: 'Unauthorized' } })
    );
    const result = await quickzuAuth.validate?.({ auth: 'bad', server: { apiUrl: '', publicUrl: '' } });
    expect(result).toMatchObject({ valid: false });
  });
});

describe('client errors', () => {
  it('wraps vendor errors without the request body and without status+body', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({ title: 'secret-input' }, { status: 404, responseBody: { message: 'Product not found' } })
    );
    const error = await new QuickzuAPIClient('tok').deleteProduct('p1').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(String(Reflect.get(Object(error), 'message'))).toContain('status 404');
    expect(String(Reflect.get(Object(error), 'message'))).toContain('Product not found');
    expect(String(Reflect.get(Object(error), 'message'))).not.toContain('secret-input');
    expect(Reflect.get(Object(error), 'responseBody')).toEqual({ message: 'Product not found' });
    expect(Reflect.get(Object(error), 'body')).toBeUndefined();
  });
});

describe('toQuickzuDate', () => {
  it('keeps date-only input and trims ISO datetimes', () => {
    expect(toQuickzuDate('2026-01-05')).toBe('2026-01-05');
    expect(toQuickzuDate('2026-01-05T23:00:00.000Z')).toBe('2026-01-05');
  });
});

describe('update product', () => {
  it('fills the fields the PUT requires from the current product', async () => {
    const send = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      if (request.method === 'GET') {
        return {
          status: 200,
          headers: {},
          body: {
            data: [
              { _id: 'other', name: 'X', category: { _id: 'c9', name: 'Y' }, mrp: 1, price: 1, unit: 'piece', value_per_unit: 1 },
              { _id: 'p1', name: 'Cookie', category: { _id: 'c1', name: 'Bakery' }, mrp: 20, price: 18, unit: 'gram', value_per_unit: 200 },
            ],
          },
        };
      }
      return { status: 200, headers: {}, body: { _id: 'p1' } };
    });
    await updateProductAction.run(actionContext({ productId: 'p1', price: 15 }));
    const put = send.mock.calls.find(([request]) => request.method === 'PUT');
    expect(put?.[0].url).toBe('https://app.quickzu.com/api/seller/products/p1');
    expect(put?.[0].body).toMatchObject({
      name: 'Cookie',
      category: 'c1',
      mrp: 20,
      price: 15,
      unit: 'gram',
      value_per_unit: 200,
    });
  });

  it('skips the lookup when every required field is given', async () => {
    const send = mockSend({ _id: 'p1' });
    await updateProductAction.run(
      actionContext({ productId: 'p1', name: 'N', categoryId: 'c2', mrp: 5, price: 4, unit: 'piece', value_per_unit: 1 })
    );
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0][0].method).toBe('PUT');
  });

  it('fails clearly when the product does not exist', async () => {
    mockSend({ data: [] });
    await expect(updateProductAction.run(actionContext({ productId: 'missing', price: 1 }))).rejects.toThrow(
      'Product missing was not found'
    );
  });
});

describe('vendor error body fallback', () => {
  it('keeps an unrecognised body as JSON in the message and raw in responseBody', async () => {
    const vendorBody = { success: false, data: { field: 'name', reason: 'required' } };
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(
      new HttpError({ secret: 'x' }, { status: 400, responseBody: vendorBody })
    );
    const error = await new QuickzuAPIClient('tok').listCategories().catch((e: unknown) => e);
    expect(String(Reflect.get(Object(error), 'message'))).toContain('"reason":"required"');
    expect(Reflect.get(Object(error), 'responseBody')).toEqual(vendorBody);
  });

  it('reads an errors array and accepts a duck-typed error', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue({
      response: { status: 422, body: { errors: [{ message: 'mrp must be a number' }, 'price invalid'] } },
    });
    const error = await new QuickzuAPIClient('tok').listCategories().catch((e: unknown) => e);
    expect(String(Reflect.get(Object(error), 'message'))).toContain('mrp must be a number; price invalid');
  });
});

describe('delete of a missing item', () => {
  it('explains that the item may already be deleted', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue({
      response: { status: 400, body: { status: false, message: 'Resource failed to delete.' } },
    });
    const error = await new QuickzuAPIClient('tok').deleteCategory('gone').catch((e: unknown) => e);
    const message = String(Reflect.get(Object(error), 'message'));
    expect(message).toContain('may already be deleted');
    expect(message).toContain('Resource failed to delete.');
  });

  it('marks AI-visible deletes as not idempotent', () => {
    const actions = quickzu.actions();
    expect(actions['quickzu_delete_product'].aiMetadata?.idempotent).toBe(false);
    expect(actions['quickzu_delete_category'].aiMetadata?.idempotent).toBe(false);
  });
});
