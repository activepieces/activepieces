import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { PropertyContext } from '@activepieces/pieces-framework';
import { BASE_URL } from '../src/lib/common/client';
import { sallaMarketing } from '../src/lib/common/marketing';
import { sallaProps } from '../src/lib/common/props';

const auth = { access_token: 'token' };

function raw<T>(value: unknown): T {
  if (acceptsAnything<T>(value)) {
    return value;
  }
  throw new Error('unreachable');
}

function acceptsAnything<T>(value: unknown): value is T {
  return value !== undefined || value === undefined;
}

function ok(body: unknown) {
  return respond({ body, status: 200 });
}

function respond({ body, status }: { body: unknown; status: number }) {
  return { status, headers: {}, body };
}

function pathOf(request: HttpRequest): string {
  return new URL(request.url).pathname.replace('/admin/v2', '');
}

function paramsOf(request: HttpRequest): URLSearchParams {
  return new URL(request.url).searchParams;
}

function loadCouponOptions({ connected = true, searchValue }: { connected?: boolean; searchValue?: string }) {
  const property = sallaProps.coupon({ required: true });
  return property.options(raw<Parameters<typeof property.options>[0]>({ auth: connected ? auth : undefined }), raw<PropertyContext>({ searchValue }));
}

function loadCartOptions({ searchValue }: { searchValue?: string }) {
  const property = sallaProps.abandonedCart({ required: true });
  return property.options(raw<Parameters<typeof property.options>[0]>({ auth }), raw<PropertyContext>({ searchValue }));
}

const onePage = { currentPage: 1, totalPages: 1 };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createCoupon', () => {
  it('POSTs the built body to /coupons and adds the flat keys', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      respond({ body: { data: { id: 1622617640, code: 'SUMMER10', type: 'percentage', amount: 10 } }, status: 201 }),
    );
    const result = await sallaMarketing.createCoupon({
      auth,
      input: { code: 'SUMMER10', type: 'P', amount: 10, expiryDate: '2099-12-31', maximumAmount: 50, freeShipping: 'yes', includeProductIds: '1,1' },
    });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.POST);
    expect(sent.url).toBe(`${BASE_URL}/coupons`);
    expect(sent.retries).toBe(0);
    expect(sent.body).toEqual({
      code: 'SUMMER10',
      type: 'percentage',
      amount: 10,
      free_shipping: true,
      expiry_date: '2099-12-31 23:59:59',
      exclude_sale_products: false,
      maximum_amount: 50,
      products_include: ['1'],
    });
    expect(result).toMatchObject({ id: 1622617640, type_normalized: 'percentage', amount_value: 10 });
  });

  it('does not call Salla for an expired coupon', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(sallaMarketing.createCoupon({ auth, input: { code: 'OLD', type: 'fixed', amount: 5, expiryDate: '2020-01-01' } })).rejects.toThrow(
      'at least one day after today',
    );
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('getCoupon', () => {
  it('makes one call without stats', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { id: 9, code: 'A' } }));
    const result = await sallaMarketing.getCoupon({ auth, couponId: ' 9 ' });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.GET, url: `${BASE_URL}/coupons/9` });
    expect(result).toMatchObject({ id: 9, code: 'A', usage_count: null });
    expect(result).not.toHaveProperty('statistics');
  });

  it('makes two calls with stats and adds them under statistics', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) =>
      pathOf(request) === '/coupons/statistics/9'
        ? ok({ data: { num_of_usage: 3, num_of_customers: 2, coupon_sales: { amount: 300, currency: 'SAR' } } })
        : ok({ data: { id: 9, code: 'A' } }),
    );
    const result = await sallaMarketing.getCoupon({ auth, couponId: 9, includeStats: true });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls.map(([request]) => pathOf(request)).sort()).toEqual(['/coupons/9', '/coupons/statistics/9']);
    expect(result).toMatchObject({
      id: 9,
      code: 'A',
      statistics: { num_of_usage: 3, num_of_customers: 2 },
      usage_count: 3,
      customer_count: 2,
      sales_amount: 300,
    });
  });

  it('skips statistics that are not a record, and rejects a bad ID', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) =>
      pathOf(request).startsWith('/coupons/statistics') ? ok({ data: [] }) : ok({ data: { id: 9 } }),
    );
    expect(await sallaMarketing.getCoupon({ auth, couponId: 9, includeStats: true })).not.toHaveProperty('statistics');
    await expect(sallaMarketing.getCoupon({ auth, couponId: 'SUMMER10' })).rejects.toThrow('Coupon ID must be a numeric Salla ID');
    expect(spy).toHaveBeenCalledTimes(2);
  });
});

describe('listCoupons', () => {
  it('GETs /coupons with keyword and date ranges as array params', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: [{ id: 1, code: 'A', type: 'f' }, 'junk'], pagination: onePage }));
    const result = await sallaMarketing.listCoupons({
      auth,
      filters: { maxResults: 5, keyword: ' A ', createdFrom: '2026-01-01', expiresTo: '2026-12-31' },
    });
    const sent = spy.mock.calls[0][0];
    expect(pathOf(sent)).toBe('/coupons');
    const params = paramsOf(sent);
    expect(params.get('keyword')).toBe('A');
    expect(params.getAll('creation_date[]')).toEqual(['2026-01-01,2099-12-31']);
    expect(params.getAll('expiration_date[]')).toEqual(['2000-01-01,2026-12-31']);
    expect(params.get('per_page')).toBe('60');
    expect(result).toEqual({ coupons: [expect.objectContaining({ id: 1, type_normalized: 'fixed' })], count: 1, truncated: false });
  });
});

describe('listAbandonedCarts', () => {
  it('GETs /carts/abandoned with keyword and offset', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok(JSON.stringify({ data: [{ id: 5, total: { amount: 99, currency: 'SAR' } }], pagination: { currentPage: 1, totalPages: 3 } })),
    );
    const result = await sallaMarketing.listAbandonedCarts({ auth, filters: { maxResults: 1, keyword: '0501', olderThanMinutes: 60 } });
    const sent = spy.mock.calls[0][0];
    expect(pathOf(sent)).toBe('/carts/abandoned');
    expect(paramsOf(sent).get('keyword')).toBe('0501');
    expect(paramsOf(sent).get('offset')).toBe('60');
    expect(paramsOf(sent).get('per_page')).toBe('60');
    expect(result).toEqual({ carts: [expect.objectContaining({ id: 5, total_amount: 99, currency: 'SAR' })], count: 1, truncated: true });
  });

  it('does not call Salla for a bad offset', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(sallaMarketing.listAbandonedCarts({ auth, filters: { maxResults: 1, olderThanMinutes: -5 } })).rejects.toThrow('whole number of minutes');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('getAbandonedCart', () => {
  it('GETs /carts/abandoned/{id} and adds the flat keys', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok(JSON.stringify({ data: { id: 1097962121, checkout_url: 'https://store.example/c', items: [{ product_id: 1, quantity: 2 }] } })),
    );
    const result = await sallaMarketing.getAbandonedCart({ auth, cartId: '1097962121' });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.GET, url: `${BASE_URL}/carts/abandoned/1097962121` });
    expect(result).toMatchObject({ id: 1097962121, checkout_url: 'https://store.example/c', item_count: 1, item_quantity: 2, product_ids: [1] });
    await expect(sallaMarketing.getAbandonedCart({ auth, cartId: 'abc' })).rejects.toThrow('Cart ID must be a numeric Salla ID');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('coupon dropdown', () => {
  it('asks to connect first', async () => {
    expect(await loadCouponOptions({ connected: false })).toEqual({ disabled: true, options: [], placeholder: 'Connect your Salla account first.' });
  });

  it('labels coupons with code, discount and status', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok({
        data: [
          { id: 1, code: 'SUMMER10', type: 'percentage', amount: 10, status: 'active' },
          { id: 2, code: 'FLAT25', type: 'fixed', amount: { amount: 25, currency: 'SAR' }, status: 'inactive' },
          { id: 3, code: '', type: 'P', amount: { amount: 5, currency: 'SAR' } },
          { id: 4, code: 'NOAMOUNT' },
          { code: 'NOID' },
        ],
        pagination: onePage,
      }),
    );
    expect(await loadCouponOptions({})).toEqual({
      disabled: false,
      options: [
        { label: 'SUMMER10 · 10% · active', value: '1' },
        { label: 'FLAT25 · 25 SAR · inactive', value: '2' },
        { label: 'Coupon 3 · 5%', value: '3' },
        { label: 'NOAMOUNT', value: '4' },
      ],
      placeholder: undefined,
    });
  });

  it('sends the search as keyword and explains no match', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: [] }));
    expect((await loadCouponOptions({ searchValue: ' SUM ' })).placeholder).toBe('No coupon matches this search.');
    expect(paramsOf(spy.mock.calls[0][0]).get('keyword')).toBe('SUM');
    expect((await loadCouponOptions({})).placeholder).toContain('No coupons found');
    expect(paramsOf(spy.mock.calls[1][0]).has('keyword')).toBe(false);
  });
});

describe('abandonedCart dropdown', () => {
  it('labels carts with ID, customer, total and age', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok({
        data: [
          { id: 5, customer: { name: 'Ali' }, total: { amount: 200, currency: 'SAR' }, age_in_minutes: 45.6 },
          { id: 6, customer: { mobile: 966501234567 }, total: 50, currency: 'SAR' },
          { id: 7 },
        ],
        pagination: onePage,
      }),
    );
    expect(await loadCartOptions({ searchValue: '0501' })).toEqual({
      disabled: false,
      options: [
        { label: 'Cart 5 · Ali · 200 SAR · 46 min old', value: '5' },
        { label: 'Cart 6 · 966501234567 · 50 SAR', value: '6' },
        { label: 'Cart 7', value: '7' },
      ],
      placeholder: undefined,
    });
    expect(pathOf(spy.mock.calls[0][0])).toBe('/carts/abandoned');
    expect(paramsOf(spy.mock.calls[0][0]).get('keyword')).toBe('0501');
  });

  it('explains an empty list', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: [] }));
    expect((await loadCartOptions({})).placeholder).toContain('No abandoned carts found');
    expect((await loadCartOptions({ searchValue: 'x' })).placeholder).toBe('No abandoned cart matches this search.');
  });
});
