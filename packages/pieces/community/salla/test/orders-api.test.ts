import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { sallaOrders } from '../src/lib/common/orders';

const auth = { access_token: 'token' };

function pathOf(request: HttpRequest): string {
  return new URL(request.url).pathname.replace('/admin/v2', '');
}

function pageOf(request: HttpRequest): number {
  return Number(new URL(request.url).searchParams.get('page'));
}

function mockOrderWithItems({ itemCount, perPage }: { itemCount: number; perPage: number }) {
  const totalPages = Math.max(1, Math.ceil(itemCount / perPage));
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    if (pathOf(request) === '/orders/items') {
      const page = pageOf(request);
      const start = (page - 1) * perPage;
      const data = Array.from({ length: Math.max(0, Math.min(perPage, itemCount - start)) }, (_, index) => ({
        id: start + index + 1,
        name: `Item ${start + index + 1}`,
      }));
      return { status: 200, headers: {}, body: { data, pagination: { currentPage: page, totalPages } } };
    }
    return { status: 200, headers: {}, body: { data: { id: 7, reference_id: 1001 } } };
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getOrder', () => {
  it('leaves items and items_truncated out when Include Items is off', async () => {
    const spy = mockOrderWithItems({ itemCount: 3, perPage: 60 });
    const order = await sallaOrders.getOrder({ auth, orderId: 7, includeItems: false });
    expect(order).not.toHaveProperty('items');
    expect(order).not.toHaveProperty('items_truncated');
    expect(spy.mock.calls.every(([request]) => pathOf(request) !== '/orders/items')).toBe(true);
  });

  it('returns every item and items_truncated false when the order fits under the limit', async () => {
    mockOrderWithItems({ itemCount: 3, perPage: 60 });
    const order = await sallaOrders.getOrder({ auth, orderId: 7, includeItems: true });
    expect(order['items']).toHaveLength(3);
    expect(order['items_truncated']).toBe(false);
  });

  it('flags items_truncated when the order has more than 500 items', async () => {
    mockOrderWithItems({ itemCount: 540, perPage: 60 });
    const order = await sallaOrders.getOrder({ auth, orderId: 7, includeItems: true });
    expect(order['items']).toHaveLength(500);
    expect(order['items_truncated']).toBe(true);
  });
});
