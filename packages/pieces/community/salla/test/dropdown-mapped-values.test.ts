import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty, createMockActionContext, StaticPropsValue } from '@activepieces/pieces-framework';
import { adjustStockAction } from '../src/lib/actions/adjust-stock';
import { findOrdersAction } from '../src/lib/actions/find-orders';
import { updateProductAction } from '../src/lib/actions/update-product';
import { updateVariantAction } from '../src/lib/actions/update-variant';
import { sallaAuth } from '../src/lib/auth';
import { CreateCustomerInput, sallaCustomers } from '../src/lib/common/customers';
import { sallaUtils } from '../src/lib/common/helpers';
import { CreateCouponInput, sallaMarketing } from '../src/lib/common/marketing';
import { OrderFilters, sallaOrders } from '../src/lib/common/orders';
import { sallaProducts } from '../src/lib/common/products';

const AUTH: AppConnectionValueForAuthProperty<typeof sallaAuth> = {
  type: AppConnectionType.OAUTH2,
  access_token: 'token',
  client_id: 'client',
  client_secret: 'secret',
  redirect_url: 'https://example.com',
  token_type: 'Bearer',
  claimed_at: 0,
  refresh_token: 'refresh',
  scope: '',
  token_url: 'https://accounts.salla.sa/oauth2/token',
  data: {},
  props: {},
};

function recordRequests(): HttpRequest[] {
  const requests: HttpRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    requests.push(request);
    const isList = request.method === HttpMethod.GET && new URL(request.url).pathname.endsWith('/orders');
    return { status: 200, headers: {}, body: { data: isList ? [] : { id: 7, message: 'queued' } } };
  });
  return requests;
}

function runAdjustStock(propsValue: Record<string, unknown>): Promise<unknown> {
  const props = propsValue as unknown as StaticPropsValue<typeof adjustStockAction.props>;
  return adjustStockAction.run({ ...createMockActionContext<typeof adjustStockAction.props>({ propsValue: props }), auth: AUTH });
}

function runFindOrders(propsValue: Record<string, unknown>): Promise<unknown> {
  const props = propsValue as unknown as StaticPropsValue<typeof findOrdersAction.props>;
  return findOrdersAction.run({ ...createMockActionContext<typeof findOrdersAction.props>({ propsValue: props }), auth: AUTH });
}

function runUpdateVariant(propsValue: Record<string, unknown>): Promise<unknown> {
  const props = propsValue as unknown as StaticPropsValue<typeof updateVariantAction.props>;
  return updateVariantAction.run({ ...createMockActionContext<typeof updateVariantAction.props>({ propsValue: props }), auth: AUTH });
}

function runUpdateProduct(propsValue: Record<string, unknown>): Promise<unknown> {
  const props = propsValue as unknown as StaticPropsValue<typeof updateProductAction.props>;
  return updateProductAction.run({ ...createMockActionContext<typeof updateProductAction.props>({ propsValue: props }), auth: AUTH });
}

function stockLine(requests: HttpRequest[]): unknown {
  const post = requests.find((request) => request.method === HttpMethod.POST);
  const body = post?.body as { products: unknown[] } | undefined;
  return body?.products[0];
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('dropdownText', () => {
  it('turns a mapped number into its digits', () => {
    expect(sallaUtils.dropdownText(1672932878, 'Product')).toBe('1672932878');
    expect(sallaUtils.dropdownText(0, 'Product')).toBe('0');
  });

  it('trims a string and keeps ids above 2^53 exactly', () => {
    expect(sallaUtils.dropdownText(' 1672932878 ', 'Product')).toBe('1672932878');
    expect(sallaUtils.dropdownText('1234567890123456789', 'Product')).toBe('1234567890123456789');
    expect(sallaUtils.dropdownText(BigInt('1234567890123456789'), 'Product')).toBe('1234567890123456789');
  });

  it('treats only undefined, null and blank text as empty', () => {
    for (const value of [undefined, null, '', '   ']) {
      expect(sallaUtils.dropdownText(value, 'Customer'), String(value)).toBeUndefined();
    }
  });

  it('fails loudly, naming the field, on a mapped object, list, boolean or non-finite number', () => {
    expect(() => sallaUtils.dropdownText({ id: 1227534533 }, 'Customer')).toThrow(
      'Customer must be text or a number, such as an ID, but got {"id":1227534533}.',
    );
    for (const value of [[1, 2], true, {}, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(() => sallaUtils.dropdownText(value, 'Branch'), String(value)).toThrow('Branch must be text or a number');
    }
  });
});

describe('Adjust Stock with mapped dropdown values', () => {
  const base = { mode: 'increment', find_by: 'id', product: undefined, variant: undefined, sku: undefined, quantity: 5, branch: undefined, reason: undefined };

  it('accepts a mapped numeric product ID', async () => {
    const requests = recordRequests();
    await runAdjustStock({ ...base, product: 1672932878 });
    expect(stockLine(requests)).toEqual({ identifer_type: 'id', identifer: '1672932878', quantity: 5, mode: 'increment' });
  });

  it('accepts a mapped numeric variant ID, branch and reason', async () => {
    const requests = recordRequests();
    await runAdjustStock({ ...base, find_by: 'variant_id', product: 1672932878, variant: 1980012345, branch: 1473353380, reason: 42 });
    expect(stockLine(requests)).toEqual({
      identifer_type: 'variant_id',
      identifer: '1980012345',
      quantity: 5,
      mode: 'increment',
      branch: 1473353380,
      reason_id: 42,
    });
  });

  it('still accepts a numeric string and a SKU', async () => {
    let requests = recordRequests();
    await runAdjustStock({ ...base, product: ' 1672932878 ' });
    expect(stockLine(requests)).toMatchObject({ identifer: '1672932878' });
    vi.restoreAllMocks();
    requests = recordRequests();
    await runAdjustStock({ ...base, find_by: 'sku', sku: ' TSHIRT-RED-M ' });
    expect(stockLine(requests)).toMatchObject({ identifer_type: 'sku', identifer: 'TSHIRT-RED-M' });
  });

  it('fails on a mapped product object, naming the field', async () => {
    const requests = recordRequests();
    await expect(runAdjustStock({ ...base, product: { id: 1672932878 } })).rejects.toThrow('Product must be text or a number');
    expect(requests).toEqual([]);
  });

  it('rejects an empty product, variant or SKU before calling Salla', async () => {
    const requests = recordRequests();
    await expect(runAdjustStock({ ...base, product: '  ' })).rejects.toThrow('Pick the product whose stock changes.');
    await expect(runAdjustStock({ ...base, find_by: 'variant_id', product: 1, variant: null })).rejects.toThrow('Pick the product and then the variant');
    await expect(runAdjustStock({ ...base, find_by: 'sku', sku: '' })).rejects.toThrow('Give the SKU');
    expect(requests).toEqual([]);
  });
});

describe('Find Orders with a mapped customer', () => {
  const base = {
    statuses: undefined,
    payment_methods: undefined,
    created: undefined,
    customer: undefined,
    reference_number: undefined,
    keyword: undefined,
    branches: undefined,
    sort_by: undefined,
    max_results: 10,
  };

  it('filters by a mapped numeric customer ID instead of throwing', async () => {
    const requests = recordRequests();
    await runFindOrders({ ...base, customer: 1227534533 });
    expect(new URL(requests[0].url).searchParams.get('customer_id')).toBe('1227534533');
  });

  it('fails on a mapped customer object instead of returning every order', async () => {
    const requests = recordRequests();
    await expect(runFindOrders({ ...base, customer: { id: 1227534533, name: 'Sara' } })).rejects.toThrow(
      'Customer must be text or a number',
    );
    expect(requests).toEqual([]);
  });

  it('ignores a blank customer and still trims a reference number', async () => {
    const requests = recordRequests();
    await runFindOrders({ ...base, customer: '  ', reference_number: ' 41027662 ' });
    const params = new URL(requests[0].url).searchParams;
    expect(params.get('customer_id')).toBeNull();
    expect(params.get('reference_id')).toBe('41027662');
  });
});

describe('Update Variant', () => {
  const base = {
    product: undefined,
    variant: undefined,
    price: undefined,
    sale_price: undefined,
    cost_price: undefined,
    sku: undefined,
    barcode: undefined,
    stock_quantity: undefined,
    notify_low: undefined,
    weight: undefined,
    mpn: undefined,
    gtin: undefined,
    branch: undefined,
    reason: undefined,
  };

  function putOf(requests: HttpRequest[]): HttpRequest | undefined {
    return requests.find((request) => request.method === HttpMethod.PUT);
  }

  it('updates a variant picked from the list', async () => {
    const requests = recordRequests();
    await runUpdateVariant({ ...base, product: '1672932878', variant: '1980012345', price: 99.5, sku: ' TSHIRT-RED-M ' });
    const put = putOf(requests);
    expect(new URL(put?.url ?? '').pathname).toBe('/admin/v2/products/variants/1980012345');
    expect(put?.body).toEqual({ sku: 'TSHIRT-RED-M', price: 99.5 });
  });

  it('accepts a mapped numeric variant ID', async () => {
    const requests = recordRequests();
    await runUpdateVariant({ ...base, variant: 1980012345, stock_quantity: 4 });
    const put = putOf(requests);
    expect(new URL(put?.url ?? '').pathname).toBe('/admin/v2/products/variants/1980012345');
    expect(put?.body).toEqual({ stock_quantity: 4 });
  });

  it('sets the stock of a mapped numeric branch instead of the whole variant', async () => {
    const requests = recordRequests();
    await runUpdateVariant({ ...base, variant: 1980012345, stock_quantity: 4, branch: 1473353380, reason: 42 });
    expect(putOf(requests)?.body).toEqual({ quantities: [{ branch: 1473353380, quantity: 4, reason_id: 42 }] });
  });

  it('refuses a mapped numeric reason without a branch', async () => {
    const requests = recordRequests();
    await expect(runUpdateVariant({ ...base, variant: 1980012345, stock_quantity: 4, reason: 42 })).rejects.toThrow(
      'Reason is saved with a branch stock change.',
    );
    expect(requests).toEqual([]);
  });

  it('fails on a mapped branch or reason object instead of updating the whole variant', async () => {
    const requests = recordRequests();
    await expect(runUpdateVariant({ ...base, variant: 1980012345, stock_quantity: 4, branch: { id: 1473353380 } })).rejects.toThrow(
      'Branch must be text or a number',
    );
    await expect(
      runUpdateVariant({ ...base, variant: 1980012345, stock_quantity: 4, branch: 1473353380, reason: { id: 42 } }),
    ).rejects.toThrow('Reason must be text or a number');
    expect(requests).toEqual([]);
  });

  it('asks for Stock Quantity when a branch is picked without it', async () => {
    const requests = recordRequests();
    await expect(runUpdateVariant({ ...base, variant: '1980012345', price: 5, branch: 1473353380 })).rejects.toThrow(
      'Fill Stock Quantity to set the stock of the picked branch',
    );
    expect(requests).toEqual([]);
  });
});

describe('Update Product with a mapped numeric product', () => {
  it('updates the product by ID', async () => {
    const requests = recordRequests();
    await runUpdateProduct({ find_by: 'id', product: 1672932878, lookup_sku: undefined, name: 'Cotton T-shirt' });
    const put = requests.find((request) => request.method === HttpMethod.PUT);
    expect(new URL(put?.url ?? '').pathname).toBe('/admin/v2/products/1672932878');
  });
});

describe('static dropdowns that get a mapped number', () => {
  const customer = (gender: unknown): CreateCustomerInput => ({ firstName: 'Ali', lastName: 'Saleh', mobile: '+966501234567', gender: gender as CreateCustomerInput['gender'] });
  const coupon = (overrides: Record<string, unknown>): CreateCouponInput => ({
    code: 'SUMMER10',
    type: 'percentage',
    amount: '10',
    expiryDate: '2026-12-31',
    maximumAmount: 50,
    ...overrides,
  } as CreateCouponInput);

  it('fail with the value named instead of silently dropping it', () => {
    expect(() => sallaCustomers.buildCreateCustomerBody(customer(1))).toThrow('"1" is not a gender Salla accepts.');
    expect(() => sallaMarketing.buildCreateCouponBody(coupon({ status: 1 }))).toThrow('"1" is not a coupon status.');
    expect(() => sallaMarketing.buildCreateCouponBody(coupon({ appliedIn: 2 }))).toThrow('"2" is not a valid channel.');
    expect(() => sallaMarketing.buildCreateCouponBody(coupon({ type: 3 }))).toThrow('"3" is not a coupon type.');
    expect(() => sallaMarketing.buildCreateCouponBody(coupon({ status: { value: 'active' } }))).toThrow('Coupon status must be text or a number');
    expect(() => sallaCustomers.buildCreateCustomerBody(customer({ value: 'male' }))).toThrow('Gender must be text or a number');
    expect(() => sallaProducts.buildProductListQuery({ maxResults: 10, status: 4 } as unknown as Parameters<typeof sallaProducts.buildProductListQuery>[0])).toThrow(
      '"4" is not a product status.',
    );
  });
});

describe('Find Orders payment methods from a mapped list', () => {
  it('keeps numbers as text and skips blank and null entries', () => {
    const paymentMethods = [' mada ', '', null, 7] as unknown as OrderFilters['paymentMethods'];
    expect(sallaOrders.buildOrderListQuery({ maxResults: 10, paymentMethods })['payment_method']).toEqual(['mada', '7']);
  });

  it('fails on a mapped object entry instead of dropping it', () => {
    const paymentMethods = ['mada', { slug: 'cod' }] as unknown as OrderFilters['paymentMethods'];
    expect(() => sallaOrders.buildOrderListQuery({ maxResults: 10, paymentMethods })).toThrow('Payment method must be text or a number');
  });
});
