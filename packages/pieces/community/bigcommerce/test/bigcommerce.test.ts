import { HttpError, HttpMethod, httpClient } from '@activepieces/pieces-common';
import { createMockActionContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { normalizeStoreHash } from '../src/lib/common/constants';
import {
  BigCommerceError,
  bigCommerceApiService,
  buildQuery,
  extractVendorMessage,
} from '../src/lib/common/requests';
import {
  parseCommaList,
  parseIdList,
  parseIsoDate,
  parseYesNo,
  toRfc2822,
  validatePaging,
} from '../src/lib/common/shared-runs';

const auth = { storeHash: 'abc123', accessToken: 'token' };

function runAction({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  const base = createMockActionContext<InputPropertyMap>({ propsValue: {} });
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [{ ...base, propsValue, auth: { props: auth } }]));
}

function mockResponse({ status, body }: { status: number; body: unknown }) {
  return vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status, headers: {}, body });
}

function mockHttpError({ status, body }: { status: number; body: unknown }) {
  return vi
    .spyOn(httpClient, 'sendRequest')
    .mockRejectedValue(new HttpError(undefined, { status, responseBody: body }));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildQuery', () => {
  it('drops empty values and keeps zero', () => {
    expect(buildQuery({ a: 'x', b: '', c: undefined, d: null, price: 0, name: '  y ' })).toEqual({
      a: 'x',
      price: '0',
      name: 'y',
    });
  });
});

describe('parsers', () => {
  it('parses comma lists', () => {
    expect(parseCommaList(' 1, 2,,3 ')).toEqual(['1', '2', '3']);
    expect(parseCommaList(undefined)).toEqual([]);
  });
  it('parses id lists and rejects non-numeric ids', () => {
    expect(parseIdList({ value: '12, 15', field: 'ids' })).toEqual([12, 15]);
    expect(() => parseIdList({ value: '12,abc', field: 'ids' })).toThrow('ids');
  });
  it('parses yes/no', () => {
    expect(parseYesNo({ value: 'yes', field: 'f' })).toBe(true);
    expect(parseYesNo({ value: 'no', field: 'f' })).toBe(false);
    expect(parseYesNo({ value: undefined, field: 'f' })).toBeUndefined();
    expect(() => parseYesNo({ value: 'true', field: 'f' })).toThrow();
  });
  it('accepts ISO dates and rejects others', () => {
    expect(parseIsoDate({ value: '2026-01-31T15:00:00Z', field: 'd' })).toBe('2026-01-31T15:00:00Z');
    expect(parseIsoDate({ value: '2026-01-31', field: 'd' })).toBe('2026-01-31');
    expect(() => parseIsoDate({ value: 'Jan 31 2026', field: 'd' })).toThrow();
  });
  it('validates paging', () => {
    expect(validatePaging({ limit: 250, page: 2 })).toEqual({ limit: 250, page: 2 });
    expect(validatePaging({ limit: undefined, page: undefined })).toEqual({});
    expect(() => validatePaging({ limit: 251, page: undefined })).toThrow();
    expect(() => validatePaging({ limit: undefined, page: 0 })).toThrow();
  });
});

describe('toRfc2822', () => {
  it('converts ISO dates to the RFC 2822 form v2 blog posts accept', () => {
    expect(toRfc2822({ value: '2026-11-20T10:00:00Z', field: 'd' })).toBe('Fri, 20 Nov 2026 10:00:00 +0000');
    expect(toRfc2822({ value: '2026-11-20T12:00:00+02:00', field: 'd' })).toBe('Fri, 20 Nov 2026 10:00:00 +0000');
    expect(toRfc2822({ value: undefined, field: 'd' })).toBeUndefined();
  });
  it('rejects unparseable dates', () => {
    expect(() => toRfc2822({ value: 'not a date', field: 'Published Date' })).toThrow('Published Date is not a valid date');
  });
});

describe('normalizeStoreHash', () => {
  it('accepts a hash, an API path and a control panel URL', () => {
    expect(normalizeStoreHash(' abcd1234 ')).toBe('abcd1234');
    expect(normalizeStoreHash('https://api.bigcommerce.com/stores/abcd1234/v3/')).toBe('abcd1234');
    expect(normalizeStoreHash('https://store-abcd1234.mybigcommerce.com/manage')).toBe('abcd1234');
  });
  it('rejects hashes that could change the host or path', () => {
    expect(() => normalizeStoreHash('abc/../x')).toThrow();
    expect(() => normalizeStoreHash('evil.io')).toThrow();
  });
});

describe('fireHttpRequest via service', () => {
  it('returns [] when list orders gets a 204', async () => {
    const spy = mockResponse({ status: 204, body: '' });
    const result = await bigCommerceApiService.fetchOrders({ auth, query: { status_id: 0, limit: 5 } });
    expect(result).toEqual([]);
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.GET,
      url: 'https://api.bigcommerce.com/stores/abc123/v2/orders',
      queryParams: { status_id: '0', limit: '5' },
    });
  });

  it('sends customer_id:in for address search', async () => {
    const spy = mockResponse({ status: 200, body: { data: [], meta: {} } });
    await bigCommerceApiService.fetchCustomerAddresses({ auth, query: { 'customer_id:in': '7,8' } });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ 'customer_id:in': '7,8' });
  });

  it('maps HTTP errors to status and vendor detail', async () => {
    mockHttpError({
      status: 422,
      body: { status: 422, title: 'The request payload is invalid', errors: { email: 'already in use' } },
    });
    const error = await bigCommerceApiService
      .createCustomer({ auth, payload: [] })
      .catch((err: unknown) => err);
    expect(error).toBeInstanceOf(BigCommerceError);
    if (error instanceof BigCommerceError) {
      expect(error.status).toBe(422);
      expect(error.message).toContain('422');
      expect(error.message).toContain('email: already in use');
      expect(error).not.toHaveProperty('body');
    }
  });

  it('tolerates 404 when deleting a webhook', async () => {
    mockHttpError({ status: 404, body: { title: 'Not found' } });
    await expect(bigCommerceApiService.deleteWebhook({ auth, webhookId: 5 })).resolves.toBeUndefined();
  });

  it('rethrows other webhook delete errors', async () => {
    mockHttpError({ status: 500, body: 'boom' });
    await expect(bigCommerceApiService.deleteWebhook({ auth, webhookId: 5 })).rejects.toThrow('500');
  });
});

describe('extractVendorMessage', () => {
  it('reads v2 array errors', () => {
    expect(extractVendorMessage([{ status: 400, message: 'bad status_id' }])).toBe('bad status_id');
  });
});

describe('qa: action and webhook behaviour', () => {
  function memoryStore({ failPut }: { failPut: boolean }) {
    const data = new Map<string, unknown>();
    return {
      data,
      store: {
        put: async (key: string, value: unknown) => {
          if (failPut) throw new Error('store down');
          data.set(key, value);
          return value;
        },
        get: async (key: string) => (data.has(key) ? data.get(key) : null),
        delete: async (key: string) => {
          data.delete(key);
        },
      },
    };
  }

  it('findOrCreateCustomer looks up by email only and returns found:true', async () => {
    const { findOrCreateCustomer } = await import('../src/lib/actions/find-or-create-customer');
    const spy = mockResponse({ status: 200, body: { data: [{ id: 9, email: 'a@b.co' }], meta: {} } });
    const result = await runAction({ action: findOrCreateCustomer, propsValue: { email: ' a@b.co ', first_name: 'A', last_name: 'B', phone: '+1999' } });
    expect(result).toEqual({ found: true, data: [{ id: 9, email: 'a@b.co' }] });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].queryParams).toEqual({ 'email:in': 'a@b.co' });
  });

  it('searchCustomer sends name:like', async () => {
    const { searchCustomer } = await import('../src/lib/actions/search-customer');
    const spy = mockResponse({ status: 200, body: { data: [], meta: {} } });
    await runAction({ action: searchCustomer, propsValue: { name: 'Jo' } });
    expect(spy.mock.calls[0][0].queryParams).toEqual({ 'name:like': 'Jo' });
  });

  it('enableWebhook deletes the created hook when store.put fails', async () => {
    const { enableWebhook } = await import('../src/lib/common/shared-runs');
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { id: 77 } } })
      .mockResolvedValueOnce({ status: 204, headers: {}, body: '' });
    const { store } = memoryStore({ failPut: true });
    await expect(
      enableWebhook({ auth, scope: 'store/order/created', webhookUrl: 'https://x', store, cacheKey: 'k' })
    ).rejects.toThrow('store down');
    expect(spy.mock.calls[1][0]).toMatchObject({ method: HttpMethod.DELETE, url: expect.stringContaining('/v3/hooks/77') });
  });

  it('disableWebhook keeps the stored id when delete fails with 500', async () => {
    const { disableWebhook } = await import('../src/lib/common/shared-runs');
    mockHttpError({ status: 500, body: 'boom' });
    const { store, data } = memoryStore({ failPut: false });
    data.set('k', 77);
    await expect(disableWebhook({ auth, store, cacheKey: 'k' })).rejects.toThrow();
    expect(data.get('k')).toBe(77);
  });

  it('disableWebhook clears the stored id on 404', async () => {
    const { disableWebhook } = await import('../src/lib/common/shared-runs');
    mockHttpError({ status: 404, body: { title: 'gone' } });
    const { store, data } = memoryStore({ failPut: false });
    data.set('k', 77);
    await disableWebhook({ auth, store, cacheKey: 'k' });
    expect(data.has('k')).toBe(false);
  });

  it('find-or-create address refuses to create past the scan cap', async () => {
    const { runFindOrCreateCustomerAddress } = await import('../src/lib/common/shared-runs');
    const spy = mockResponse({ status: 200, body: { data: [], meta: { pagination: { total_pages: 25 } } } });
    const address = { first_name: 'a', last_name: 'b', address1: '1 St', city: 'X', state_or_province: 'Y', postal_code: '1', country_code: 'US' };
    await expect(runFindOrCreateCustomerAddress({ auth, customerId: 3, address })).rejects.toThrow('No address was created');
    expect(spy).toHaveBeenCalledTimes(20);
    expect(spy.mock.calls.every((c) => c[0].method === HttpMethod.GET)).toBe(true);
  });

  it('find-or-create address matches case-insensitively on page 2', async () => {
    const { runFindOrCreateCustomerAddress } = await import('../src/lib/common/shared-runs');
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: [{ id: 1, address1: 'other', city: 'x', postal_code: '1' }], meta: { pagination: { total_pages: 2 } } } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { data: [{ id: 2, address1: '1 st', city: 'x', postal_code: '1' }], meta: { pagination: { total_pages: 2 } } } });
    const address = { first_name: 'a', last_name: 'b', address1: '1 St', city: 'X', state_or_province: 'Y', postal_code: '1', country_code: 'US' };
    const result = await runFindOrCreateCustomerAddress({ auth, customerId: 3, address });
    expect(result).toEqual({ found: true, data: { id: 2, address1: '1 st', city: 'x', postal_code: '1' } });
    expect(spy.mock.calls[1][0].queryParams).toMatchObject({ 'customer_id:in': '3', page: '2', limit: '250' });
  });

  it('deleteAProduct returns deleted:true on 204', async () => {
    const { deleteAProduct } = await import('../src/lib/actions/delete-a-product');
    mockResponse({ status: 204, body: '' });
    const result = await runAction({ action: deleteAProduct, propsValue: { productId: ' 42 ' } });
    expect(result).toEqual({ deleted: true, id: '42' });
  });
});

describe('piece registration', () => {
  it('registers every action with the expected audience', async () => {
    const { bigcommerce } = await import('../src/index');
    const expected: Record<string, string> = {
      createCustomer: 'both',
      createAProduct: 'both',
      updateAProduct: 'both',
      deleteAProduct: 'both',
      getOrder: 'both',
      listOrders: 'both',
      listCategories: 'both',
      searchCustomer: 'both',
      searchProduct: 'both',
      findOrCreateCustomer: 'both',
      findOrCreateProduct: 'both',
      getCustomer: 'both',
      getProduct: 'both',
      listBrands: 'both',
      listOrderStatuses: 'both',
      listOrderProducts: 'both',
      updateOrderStatus: 'both',
      createBlogPost: 'human',
      createCustomerAddress: 'human',
      searchCustomerAddress: 'human',
      findOrCreateCustomersAddress: 'human',
      createBlogPostAi: 'ai',
      createCustomerAddressAi: 'ai',
      searchCustomerAddressAi: 'ai',
      findOrCreateCustomersAddressAi: 'ai',
    };
    const actions = bigcommerce.actions();
    for (const [name, audience] of Object.entries(expected)) {
      expect(actions[name]?.audience, name).toBe(audience);
    }
    expect(actions['custom_api_call']).toBeDefined();
    expect(Object.keys(actions)).toHaveLength(Object.keys(expected).length + 1);
  });

  it('registers all 11 triggers', async () => {
    const { bigcommerce } = await import('../src/index');
    expect(Object.keys(bigcommerce.triggers()).sort()).toEqual(
      [
        'abandonedCart',
        'cartCreated',
        'customerAddressCreated',
        'customerAddressUpdated',
        'customerCreated',
        'customerUpdated',
        'orderCreated',
        'orderUpdated',
        'orderStatusUpdated',
        'productCreated',
        'shipmentCreated',
      ].sort()
    );
  });
});

describe('request shape of new and changed actions', () => {
  const base = 'https://api.bigcommerce.com/stores/abc123';

  it('updateOrderStatus PUTs status_id to /v2/orders/{id}', async () => {
    const { updateOrderStatus } = await import('../src/lib/actions/update-order-status');
    const spy = mockResponse({ status: 200, body: { id: 5, status_id: 2 } });
    await runAction({ action: updateOrderStatus, propsValue: { order_id: '5', status_id: '2' } });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.PUT,
      url: `${base}/v2/orders/5`,
      body: { status_id: 2 },
    });
  });

  it('createBlogPostAi POSTs RFC 2822 date and comma tags', async () => {
    const { createBlogPostAi } = await import('../src/lib/actions/create-blog-post-ai');
    const spy = mockResponse({ status: 201, body: { id: 1 } });
    await runAction({
      action: createBlogPostAi,
      propsValue: {
        title: 'T',
        body: '<p>b</p>',
        is_published: 'no',
        published_date: '2026-11-20T10:00:00Z',
        tags: 'news, sale,',
      },
    });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.POST,
      url: `${base}/v2/blog/posts`,
      body: {
        title: 'T',
        body: '<p>b</p>',
        is_published: false,
        published_date: 'Fri, 20 Nov 2026 10:00:00 +0000',
        tags: ['news', 'sale'],
      },
    });
  });

  it('createCustomerAddressAi POSTs an address array with numeric customer_id', async () => {
    const { createCustomerAddressAi } = await import('../src/lib/actions/create-customer-address-ai');
    const spy = mockResponse({ status: 200, body: { data: [{ id: 3 }], meta: {} } });
    await runAction({
      action: createCustomerAddressAi,
      propsValue: {
        customer_id: '12',
        first_name: 'Jane',
        last_name: 'Doe',
        address1: '1 Main St',
        city: 'Austin',
        state_or_province: 'Texas',
        postal_code: '78701',
        country_code: 'US',
      },
    });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.POST,
      url: `${base}/v3/customers/addresses`,
      body: [
        {
          customer_id: 12,
          first_name: 'Jane',
          last_name: 'Doe',
          address1: '1 Main St',
          city: 'Austin',
          state_or_province: 'Texas',
          postal_code: '78701',
          country_code: 'US',
        },
      ],
    });
  });

  it('createCustomerAddressAi rejects a non-numeric customer_id before any request', async () => {
    const { createCustomerAddressAi } = await import('../src/lib/actions/create-customer-address-ai');
    const spy = mockResponse({ status: 200, body: { data: [] } });
    await expect(
      runAction({ action: createCustomerAddressAi, propsValue: { customer_id: 'abc' } })
    ).rejects.toThrow('customer_id');
    expect(spy).not.toHaveBeenCalled();
  });

  it('searchCustomerAddressAi GETs with customer_id:in and paging', async () => {
    const { searchCustomerAddressAi } = await import('../src/lib/actions/search-customer-address-ai');
    const spy = mockResponse({ status: 200, body: { data: [], meta: {} } });
    await runAction({ action: searchCustomerAddressAi, propsValue: { customer_ids: '7, 8', limit: 10, page: 2 } });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.GET,
      url: `${base}/v3/customers/addresses`,
      queryParams: { 'customer_id:in': '7,8', limit: '10', page: '2' },
    });
  });

  it('getProduct GETs /v3/catalog/products/{id} and returns data', async () => {
    const { getProduct } = await import('../src/lib/actions/get-product');
    const spy = mockResponse({ status: 200, body: { data: { id: 42, name: 'P' } } });
    const result = await runAction({ action: getProduct, propsValue: { product_id: '42' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.GET, url: `${base}/v3/catalog/products/42` });
    expect(result).toEqual({ id: 42, name: 'P' });
  });

  it('getCustomer GETs /v3/customers with id:in and fails when empty', async () => {
    const { getCustomer } = await import('../src/lib/actions/get-customer');
    const spy = mockResponse({ status: 200, body: { data: [{ id: 9 }], meta: {} } });
    const result = await runAction({ action: getCustomer, propsValue: { customer_id: '9' } });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.GET,
      url: `${base}/v3/customers`,
      queryParams: { 'id:in': '9' },
    });
    expect(result).toEqual({ id: 9 });
    spy.mockResolvedValue({ status: 200, headers: {}, body: { data: [], meta: {} } });
    await expect(runAction({ action: getCustomer, propsValue: { customer_id: '9' } })).rejects.toThrow('not found');
  });

  it('listOrderProducts GETs /v2/orders/{id}/products and returns [] on 204', async () => {
    const { listOrderProducts } = await import('../src/lib/actions/list-order-products');
    const spy = mockResponse({ status: 204, body: '' });
    const result = await runAction({ action: listOrderProducts, propsValue: { order_id: '5', limit: 250 } });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.GET,
      url: `${base}/v2/orders/5/products`,
      queryParams: { limit: '250' },
    });
    expect(result).toEqual([]);
  });

  it('listBrands GETs /v3/catalog/brands with name filter', async () => {
    const { listBrands } = await import('../src/lib/actions/list-brands');
    const spy = mockResponse({ status: 200, body: { data: [], meta: {} } });
    await runAction({ action: listBrands, propsValue: { name: 'Acme' } });
    expect(spy.mock.calls[0][0]).toMatchObject({
      method: HttpMethod.GET,
      url: `${base}/v3/catalog/brands`,
      queryParams: { name: 'Acme' },
    });
  });

  it('listOrderStatuses GETs /v2/order_statuses', async () => {
    const { listOrderStatuses } = await import('../src/lib/actions/list-order-statuses');
    const spy = mockResponse({ status: 200, body: [{ id: 2, name: 'Shipped' }] });
    const result = await runAction({ action: listOrderStatuses, propsValue: {} });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.GET, url: `${base}/v2/order_statuses` });
    expect(result).toEqual([{ id: 2, name: 'Shipped' }]);
  });
});

describe('customer address trigger schema', () => {
  it('exposes data.address.customer_id and labels data.id as the address id', async () => {
    const { customerAddressEventOutputSchema } = await import('../src/lib/common/schemas');
    const data = customerAddressEventOutputSchema.fields.find((f) => f.key === 'data');
    const address = data?.children?.find((f) => f.key === 'address');
    expect(address?.children?.map((f) => f.key)).toEqual(['customer_id']);
    expect(data?.children?.find((f) => f.key === 'id')?.label).toBe('Address ID');
    const { customerAddressCreated } = await import('../src/lib/triggers/customer-address-created');
    const { customerAddressUpdated } = await import('../src/lib/triggers/customer-address-updated');
    expect(customerAddressCreated.outputSchema).toBe(customerAddressEventOutputSchema);
    expect(customerAddressUpdated.outputSchema).toBe(customerAddressEventOutputSchema);
  });
});

describe('dedupeWebhookEvent', () => {
  function seenStore() {
    const data = new Map<string, unknown>();
    const store = {
      put: async (key: string, value: unknown) => {
        data.set(key, value);
        return value;
      },
      get: async (key: string) => (data.has(key) ? data.get(key) : null),
      delete: async (key: string) => {
        data.delete(key);
      },
    };
    return { data, store };
  }
  const t0 = 1_800_000_000_000;

  it('drops a second delivery of the same hash', async () => {
    const { dedupeWebhookEvent } = await import('../src/lib/common/shared-runs');
    const { store } = seenStore();
    const body = { hash: 'h1', data: { id: 1 } };
    expect(await dedupeWebhookEvent({ store, storeKey: 'k', body, now: t0 })).toEqual([body]);
    expect(await dedupeWebhookEvent({ store, storeKey: 'k', body, now: t0 + 1000 })).toEqual([]);
  });

  it('emits different hashes', async () => {
    const { dedupeWebhookEvent } = await import('../src/lib/common/shared-runs');
    const { store } = seenStore();
    expect(await dedupeWebhookEvent({ store, storeKey: 'k', body: { hash: 'a' }, now: t0 })).toHaveLength(1);
    expect(await dedupeWebhookEvent({ store, storeKey: 'k', body: { hash: 'b' }, now: t0 })).toHaveLength(1);
  });

  it('emits the same hash again after 16 minutes', async () => {
    const { dedupeWebhookEvent } = await import('../src/lib/common/shared-runs');
    const { store } = seenStore();
    await dedupeWebhookEvent({ store, storeKey: 'k', body: { hash: 'a' }, now: t0 });
    expect(
      await dedupeWebhookEvent({ store, storeKey: 'k', body: { hash: 'a' }, now: t0 + 16 * 60 * 1000 })
    ).toHaveLength(1);
  });

  it('emits and stores nothing when hash is missing', async () => {
    const { dedupeWebhookEvent } = await import('../src/lib/common/shared-runs');
    const { store, data } = seenStore();
    const body = { data: { id: 1 } };
    expect(await dedupeWebhookEvent({ store, storeKey: 'k', body, now: t0 })).toEqual([body]);
    expect(await dedupeWebhookEvent({ store, storeKey: 'k', body, now: t0 })).toEqual([body]);
    expect(data.has('k')).toBe(false);
  });

  it('prunes expired entries and caps the list', async () => {
    const { dedupeWebhookEvent, DEDUPE_MAX_ENTRIES } = await import('../src/lib/common/shared-runs');
    const { store, data } = seenStore();
    data.set('k', [{ hash: 'old', seenAt: t0 - 20 * 60 * 1000 }, { hash: 'junk' }]);
    await dedupeWebhookEvent({ store, storeKey: 'k', body: { hash: 'new' }, now: t0 });
    expect(data.get('k')).toEqual([{ hash: 'new', seenAt: t0 }]);
    for (let i = 0; i < DEDUPE_MAX_ENTRIES + 5; i++) {
      await dedupeWebhookEvent({ store, storeKey: 'k', body: { hash: `h${i}` }, now: t0 + i });
    }
    const stored = data.get('k');
    expect(Array.isArray(stored) && stored.length).toBe(DEDUPE_MAX_ENTRIES);
  });

  it('order updated trigger run() drops a duplicate delivery', async () => {
    const { orderUpdated } = await import('../src/lib/triggers/order-updated');
    const { store } = seenStore();
    const body = { hash: 'dup', scope: 'store/order/updated', data: { type: 'order', id: 5 } };
    const runFn = orderUpdated.run;
    const first = await Reflect.apply(runFn, orderUpdated, [{ store, payload: { body } }]);
    const second = await Reflect.apply(runFn, orderUpdated, [{ store, payload: { body } }]);
    expect(first).toEqual([body]);
    expect(second).toEqual([]);
  });
});
