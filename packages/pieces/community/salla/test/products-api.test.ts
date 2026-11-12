import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { Store, StoreScope } from '@activepieces/pieces-framework';
import { BASE_URL } from '../src/lib/common/client';
import { sallaProducts } from '../src/lib/common/products';
import { sallaProps } from '../src/lib/common/props';

const auth = { access_token: 'token' };

function ok(body: unknown) {
  return respond({ body, status: 200 });
}

function respond({ body, status }: { body: unknown; status: number }) {
  return { status, headers: {}, body };
}

function pathOf(request: HttpRequest): string {
  return new URL(request.url).pathname.replace('/admin/v2', '');
}

function fakeStore(initial: Record<string, unknown> = {}): { store: Store; saved: Map<string, string>; scopes: Array<StoreScope | undefined> } {
  const saved = new Map(Object.entries(initial).map(([key, value]) => [key, JSON.stringify(value)]));
  const scopes: Array<StoreScope | undefined> = [];
  const store: Store = {
    async put<T>(key: string, value: T, scope?: StoreScope): Promise<T> {
      scopes.push(scope);
      saved.set(key, JSON.stringify(value));
      return value;
    },
    async get<T>(key: string, scope?: StoreScope): Promise<T | null> {
      scopes.push(scope);
      const raw = saved.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    async delete(key: string, scope?: StoreScope): Promise<void> {
      scopes.push(scope);
      saved.delete(key);
    },
  };
  return { store, saved, scopes };
}

const productWithOptions = {
  id: 5,
  name: 'Shirt',
  options: [
    { name: 'Color', values: [{ id: 101, name: 'Red' }, { id: 102, name: 'Blue' }] },
    { name: 'Size', values: [{ id: 201, name: 'M' }, 'junk'] },
    'junk',
  ],
};

const variants = [
  { id: 11, sku: 'TS-RED-M', related_option_values: [101, 201], price: { amount: 120, currency: 'SAR' }, stock_quantity: 5 },
  { id: 12, sku: '', related_option_values: [102] },
  { id: 13, related_option_values: [] },
];

function mockVariantApi() {
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    if (pathOf(request) === '/products/5/variants') {
      return ok({ data: variants, pagination: { currentPage: 1, totalPages: 1 } });
    }
    return ok({ data: productWithOptions });
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getProduct', () => {
  it('GETs by numeric ID and adds the flat keys', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { id: 5, price: { amount: 10, currency: 'SAR' } } }));
    const result = await sallaProducts.getProduct({ auth, by: 'id', value: ' 5 ' });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.GET);
    expect(sent.url).toBe(`${BASE_URL}/products/5`);
    expect(result).toMatchObject({ id: 5, price_amount: 10, currency: 'SAR' });
  });

  it('GETs by SKU with the SKU URL-encoded', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { id: 5 } }));
    await sallaProducts.getProduct({ auth, by: 'sku', value: ' RED M/1 ' });
    expect(spy.mock.calls[0][0].url).toBe(`${BASE_URL}/products/sku/RED%20M%2F1`);
  });

  it('rejects a bad ID or an empty SKU before calling Salla', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(sallaProducts.getProduct({ auth, by: 'id', value: 'TS-1' })).rejects.toThrow('Product ID must be a numeric Salla ID');
    await expect(sallaProducts.getProduct({ auth, by: 'sku', value: ' ' })).rejects.toThrow('Give the product SKU');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('createProduct and updateProduct', () => {
  it('POSTs the built body to /products', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(respond({ body: { data: { id: 9, name: 'Shirt' } }, status: 201 }));
    const result = await sallaProducts.createProduct({ auth, input: { name: 'Shirt', productType: 'product', price: 50, quantity: 3 } });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.POST);
    expect(sent.url).toBe(`${BASE_URL}/products`);
    expect(sent.body).toEqual({ name: 'Shirt', product_type: 'product', price: 50, quantity: 3 });
    expect(sent.retries).toBe(0);
    expect(result).toMatchObject({ id: 9, name: 'Shirt', price_amount: null });
  });

  it('makes no second call when Salla returns the requested status', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(respond({ body: { data: { id: 9, status: 'hidden' } }, status: 201 }));
    const result = await sallaProducts.createProduct({ auth, input: { name: 'Shirt', productType: 'product', price: 50, status: 'hidden' } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].body).toMatchObject({ status: 'hidden' });
    expect(result).toMatchObject({ id: 9, status: 'hidden' });
  });

  it('makes no second call when no status is requested', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(respond({ body: { data: { id: 9, status: 'sale' } }, status: 201 }));
    const result = await sallaProducts.createProduct({ auth, input: { name: 'Shirt', productType: 'product', price: 50 } });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ id: 9, status: 'sale' });
  });

  it('sets the status with one status call when Salla ignores the requested status', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      if (pathOf(request) === '/products/9/status') {
        return ok({ data: { message: 'updated' } });
      }
      return respond({ body: { data: { id: 9, name: 'Shirt', status: 'sale' } }, status: 201 });
    });
    const result = await sallaProducts.createProduct({ auth, input: { name: 'Shirt', productType: 'product', price: 50, status: 'hidden' } });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls.map(([request]) => pathOf(request))).toEqual(['/products', '/products/9/status']);
    expect(spy.mock.calls[1][0]).toMatchObject({ method: HttpMethod.POST, body: { status: 'hidden' } });
    expect(result).toMatchObject({ id: 9, name: 'Shirt', status: 'hidden' });
  });

  it('says the product was created and gives its ID when the status call fails', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      if (pathOf(request) === '/products/9/status') {
        throw new HttpError({}, { status: 422, responseBody: { error: { message: 'please add an image to the product first' } } });
      }
      return respond({ body: { data: { id: 9, status: 'hidden' } }, status: 201 });
    });
    const attempt = sallaProducts.createProduct({ auth, input: { name: 'Shirt', productType: 'product', price: 50, status: 'sale' } });
    await expect(attempt).rejects.toThrow('The product was created with ID 9, but Salla did not set its status to "sale".');
    await expect(attempt).rejects.toThrow('please add an image to the product first');
  });

  it('reads the product, then PUTs by ID or SKU, and refuses an empty update without calling Salla', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { id: 9 } }));
    await sallaProducts.updateProduct({ auth, store: fakeStore().store, by: 'id', value: 9, input: { name: 'New' } });
    await sallaProducts.updateProduct({ auth, store: fakeStore().store, by: 'sku', value: 'TS 1', input: { price: '5' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.GET, url: `${BASE_URL}/products/9` });
    expect(spy.mock.calls[1][0]).toMatchObject({ method: HttpMethod.PUT, url: `${BASE_URL}/products/9`, body: { name: 'New' } });
    expect(spy.mock.calls[2][0]).toMatchObject({ method: HttpMethod.GET, url: `${BASE_URL}/products/sku/TS%201` });
    expect(spy.mock.calls[3][0]).toMatchObject({ method: HttpMethod.PUT, url: `${BASE_URL}/products/sku/TS%201`, body: { price: 5 } });
    await expect(sallaProducts.updateProduct({ auth, store: fakeStore().store, by: 'id', value: 9, input: {} })).rejects.toThrow('Nothing to update');
    expect(spy).toHaveBeenCalledTimes(4);
  });

  it('sends the update without Accept-Language so Salla saves the name in the store language', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { id: 9 } }));
    await sallaProducts.updateProduct({ auth: { access_token: 'token', props: { language: 'en' } }, store: fakeStore().store, by: 'id', value: 9, input: { name: 'New' } });
    expect(spy.mock.calls[0][0].headers).toMatchObject({ 'Accept-Language': 'en' });
    expect(spy.mock.calls[1][0].method).toBe(HttpMethod.PUT);
    expect(spy.mock.calls[1][0].headers).not.toHaveProperty('Accept-Language');
  });

  function mockProductUpdate({
    before,
    after,
    restoreFails = false,
    putFails = false,
    onPut,
  }: {
    before: string[];
    after: string[];
    restoreFails?: boolean;
    putFails?: boolean;
    onPut?: () => void;
  }) {
    return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      if (request.method === HttpMethod.PUT) {
        onPut?.();
        if (putFails) {
          throw new HttpError({}, { status: 422, responseBody: { error: { message: 'bad product' } } });
        }
      }
      if (pathOf(request) === '/products/actions') {
        if (restoreFails) {
          throw new HttpError({}, { status: 422, responseBody: { error: { message: 'not allowed' } } });
        }
        return ok({ data: { message: 'updated' } });
      }
      if (request.method === HttpMethod.GET) {
        return ok({ data: { id: 9, channels: before, show_in_app: before.includes('app') } });
      }
      return respond({ body: { data: { id: 9, name: 'New', channels: after, show_in_app: after.includes('app') } }, status: 201 });
    });
  }

  it('makes no extra call when the sales channels did not change', async () => {
    const spy = mockProductUpdate({ before: ['web', 'app'], after: ['app', 'web'] });
    const result = await sallaProducts.updateProduct({ auth, store: fakeStore().store, by: 'id', value: 9, input: { name: 'New' } });
    expect(spy).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ id: 9, channels: ['app', 'web'], show_in_app: true });
  });

  it('puts the sales channels back when Salla resets them on update', async () => {
    const spy = mockProductUpdate({ before: ['web', 'app'], after: ['web'] });
    const result = await sallaProducts.updateProduct({ auth, store: fakeStore().store, by: 'sku', value: 'TS-1', input: { quantity: 30 } });
    expect(spy.mock.calls.map(([request]) => `${request.method} ${pathOf(request)}`)).toEqual([
      'GET /products/sku/TS-1',
      'PUT /products/sku/TS-1',
      'POST /products/actions',
    ]);
    expect(spy.mock.calls[2][0].body).toEqual({
      operations: [{ action_name: 'sale-channels', value: { channels: ['web', 'app'] } }],
      filters: { select_all: false, unselected_ids: [], ids: [9] },
    });
    expect(result).toMatchObject({ id: 9, name: 'New', channels: ['web', 'app'], show_in_app: true });
  });

  const CHANNELS_KEY = 'salla_product_channels_9';

  function savedUpdate(saved: Map<string, string>): unknown {
    return JSON.parse(saved.get(CHANNELS_KEY) ?? 'null');
  }

  it('marks the update as running only while it runs, then removes the mark', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const { store, saved, scopes } = fakeStore();
    const duringPut: unknown[] = [];
    const spy = mockProductUpdate({ before: ['web', 'app'], after: ['web'], onPut: () => duringPut.push(savedUpdate(saved)) });
    const result = await sallaProducts.updateProduct({ auth, store, by: 'id', value: 9, input: { quantity: 30 } });
    expect(spy.mock.calls[2][0].body).toMatchObject({ operations: [{ action_name: 'sale-channels', value: { channels: ['web', 'app'] } }] });
    expect(result).toMatchObject({ channels: ['web', 'app'] });
    expect(duringPut).toEqual([{ channels: ['web', 'app'], updateId: expect.any(String), startedAt: 1_000_000 }]);
    expect(saved.has(CHANNELS_KEY)).toBe(false);
    expect(scopes.every((scope) => scope === StoreScope.PROJECT)).toBe(true);
  });

  it('keeps a change the merchant makes right after an update finishes', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const { store, saved } = fakeStore();
    mockProductUpdate({ before: ['web', 'app'], after: ['web'] });
    await sallaProducts.updateProduct({ auth, store, by: 'id', value: 9, input: { quantity: 30 } });
    vi.restoreAllMocks();
    vi.spyOn(Date, 'now').mockReturnValue(1_005_000);
    const spy = mockProductUpdate({ before: ['web'], after: ['web'] });
    const result = await sallaProducts.updateProduct({ auth, store, by: 'id', value: 9, input: { quantity: 31 } });
    expect(spy.mock.calls.map(([request]) => `${request.method} ${pathOf(request)}`)).toEqual(['GET /products/9', 'PUT /products/9']);
    expect(result).toMatchObject({ channels: ['web'], show_in_app: false });
    expect(saved.has(CHANNELS_KEY)).toBe(false);
  });

  it('uses the channels of an update that is still running when Salla shows its temporary web-only value', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const { store, saved } = fakeStore({ [CHANNELS_KEY]: { channels: ['web', 'app'], updateId: 'other-update', startedAt: 990_000 } });
    const duringPut: unknown[] = [];
    const spy = mockProductUpdate({ before: ['web'], after: ['web'], onPut: () => duringPut.push(savedUpdate(saved)) });
    const result = await sallaProducts.updateProduct({ auth, store, by: 'id', value: 9, input: { quantity: 30 } });
    expect(spy.mock.calls.map(([request]) => `${request.method} ${pathOf(request)}`)).toEqual(['GET /products/9', 'PUT /products/9', 'POST /products/actions']);
    expect(spy.mock.calls[2][0].body).toMatchObject({ operations: [{ action_name: 'sale-channels', value: { channels: ['web', 'app'] } }] });
    expect(result).toMatchObject({ channels: ['web', 'app'], show_in_app: true });
    expect(duringPut).toEqual([{ channels: ['web', 'app'], updateId: expect.not.stringMatching(/^other-update$/), startedAt: 1_000_000 }]);
    expect(saved.has(CHANNELS_KEY)).toBe(false);
  });

  it('leaves the mark alone when a later overlapping update has taken it over', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const { store, saved } = fakeStore();
    const later = { channels: ['web', 'app'], updateId: 'later-update', startedAt: 1_000_000 };
    mockProductUpdate({ before: ['web', 'app'], after: ['web'], onPut: () => saved.set(CHANNELS_KEY, JSON.stringify(later)) });
    await sallaProducts.updateProduct({ auth, store, by: 'id', value: 9, input: { quantity: 30 } });
    expect(savedUpdate(saved)).toEqual(later);
  });

  it('ignores a mark that is too old, from the future or malformed, and uses the channels Salla returns', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const marks = [
      { channels: ['web', 'app'], updateId: 'crashed-update', startedAt: 940_000 },
      { channels: ['web', 'app'], updateId: 'clock-skew', startedAt: 1_000_001 },
      { channels: 'web,app', updateId: 'bad-channels', startedAt: 999_000 },
      { channels: ['web', 'app'], startedAt: 999_000 },
      { channels: ['web', 'app'], expiresAt: 2_000_000 },
    ];
    for (const mark of marks) {
      const { store, saved } = fakeStore({ [CHANNELS_KEY]: mark });
      const spy = mockProductUpdate({ before: ['web'], after: ['web'] });
      const result = await sallaProducts.updateProduct({ auth, store, by: 'id', value: 9, input: { quantity: 30 } });
      expect(spy).toHaveBeenCalledTimes(2);
      expect(result).toMatchObject({ channels: ['web'] });
      expect(saved.has(CHANNELS_KEY)).toBe(false);
      vi.restoreAllMocks();
      vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    }
  });

  it('removes the mark when the update or the channel restore fails', async () => {
    const failedPut = fakeStore();
    mockProductUpdate({ before: ['web', 'app'], after: ['web'], putFails: true });
    await expect(sallaProducts.updateProduct({ auth, store: failedPut.store, by: 'id', value: 9, input: { quantity: 30 } })).rejects.toThrow();
    expect(failedPut.saved.has(CHANNELS_KEY)).toBe(false);
    vi.restoreAllMocks();
    const failedRestore = fakeStore();
    mockProductUpdate({ before: ['web', 'app'], after: ['web'], restoreFails: true });
    await expect(sallaProducts.updateProduct({ auth, store: failedRestore.store, by: 'id', value: 9, input: { quantity: 30 } })).rejects.toThrow(
      'putting back web, app failed',
    );
    expect(failedRestore.saved.has(CHANNELS_KEY)).toBe(false);
  });

  it('Update Product Price puts the sales channels back after its full-product PUT', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const { store, saved } = fakeStore();
    const duringPut: unknown[] = [];
    const spy = mockProductUpdate({ before: ['web', 'app'], after: ['web'], onPut: () => duringPut.push(savedUpdate(saved)) });
    const result = await sallaProducts.updateProductPrice({ auth, store, input: { sku: 'TS-1', price: 10, salePrice: 8 } });
    expect(spy.mock.calls.map(([request]) => `${request.method} ${pathOf(request)}`)).toEqual([
      'GET /products/sku/TS-1',
      'PUT /products/sku/TS-1',
      'POST /products/actions',
    ]);
    expect(spy.mock.calls[1][0].body).toEqual({ price: 10, sale_price: 8 });
    expect(spy.mock.calls[2][0].body).toMatchObject({ operations: [{ action_name: 'sale-channels', value: { channels: ['web', 'app'] } }] });
    expect(result).toMatchObject({ channels: ['web', 'app'], show_in_app: true });
    expect(duringPut).toEqual([{ channels: ['web', 'app'], updateId: expect.any(String), startedAt: 1_000_000 }]);
    expect(saved.has(CHANNELS_KEY)).toBe(false);
  });

  it('Update Product Price with only a price makes one call and does not touch the store', async () => {
    const { store, scopes } = fakeStore();
    const spy = mockProductUpdate({ before: ['web', 'app'], after: ['web'] });
    await sallaProducts.updateProductPrice({ auth, store, input: { sku: 'TS-1', price: 10 } });
    expect(spy.mock.calls.map(([request]) => `${request.method} ${pathOf(request)}`)).toEqual(['POST /products/sku/TS-1/price']);
    expect(scopes).toEqual([]);
  });

  it('keeps updating when the project store fails', async () => {
    const failing: Store = {
      put: () => Promise.reject(new Error('store down')),
      get: () => Promise.reject(new Error('store down')),
      delete: () => Promise.reject(new Error('store down')),
    };
    mockProductUpdate({ before: ['web', 'app'], after: ['web'] });
    const result = await sallaProducts.updateProduct({ auth, store: failing, by: 'id', value: 9, input: { quantity: 30 } });
    expect(result).toMatchObject({ channels: ['web', 'app'] });
  });

  it('says the product was updated when putting the sales channels back fails', async () => {
    mockProductUpdate({ before: ['web', 'app'], after: ['web'], restoreFails: true });
    await expect(sallaProducts.updateProduct({ auth, store: fakeStore().store, by: 'id', value: 9, input: { quantity: 30 } })).rejects.toThrow(
      'The product was updated, but Salla changed its sales channels to web and putting back web, app failed.',
    );
  });
});

describe('deleteProduct', () => {
  it('sends DELETE /products/{id} and returns the result shape on 202', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(respond({ body: { status: 202, success: true, data: { message: 'The product has been deleted', code: 202 } }, status: 202 }));
    const result = await sallaProducts.deleteProduct({ auth, productId: '1764656014' });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.DELETE);
    expect(sent.url).toBe(`${BASE_URL}/products/1764656014`);
    expect(sent.body).toBeUndefined();
    expect(result).toEqual({ product_id: 1764656014, deleted: true, message: 'The product has been deleted' });
  });

  it('leaves the message undefined when Salla sends none, and rejects a bad ID', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(respond({ body: {}, status: 202 }));
    expect(await sallaProducts.deleteProduct({ auth, productId: 7 })).toEqual({ product_id: 7, deleted: true, message: undefined });
    await expect(sallaProducts.deleteProduct({ auth, productId: 'TS-1' })).rejects.toThrow('Product ID must be a numeric');
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe('changeProductStatus', () => {
  it('POSTs the status to /products/{id}/status', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { message: 'updated' } }));
    const result = await sallaProducts.changeProductStatus({ auth, productId: 5, status: 'out' });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.POST);
    expect(sent.url).toBe(`${BASE_URL}/products/5/status`);
    expect(sent.body).toEqual({ status: 'out' });
    expect(result).toEqual({ product_id: 5, status: 'out', message: 'updated' });
  });
});

describe('adjustStock', () => {
  it('POSTs the bulk body to /products/quantities/bulk and echoes the lines', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(respond({ body: { data: { message: 'queued', code: 201 } }, status: 201 }));
    const result = await sallaProducts.adjustStock({
      auth,
      input: {
        lines: [
          { identifierType: 'sku', identifier: 'TS-RED-M', quantity: 2, mode: 'decrement', branchId: 7, reasonId: '3' },
          { identifierType: 'id', identifier: 5, quantity: 0, mode: 'overwrite', unlimitedQuantity: 'yes' },
        ],
      },
    });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.POST);
    expect(sent.url).toBe(`${BASE_URL}/products/quantities/bulk`);
    expect(sent.body).toEqual({
      products: [
        { identifer_type: 'sku', identifer: 'TS-RED-M', quantity: 2, mode: 'decrement', branch: 7, reason_id: 3 },
        { identifer_type: 'id', identifer: '5', quantity: 0, mode: 'overwrite', unlimited_quantity: true },
      ],
    });
    expect(result).toEqual({
      queued: true,
      message: 'queued',
      line_count: 2,
      lines: [
        { identifier_type: 'sku', identifier: 'TS-RED-M', quantity: 2, mode: 'decrement', branch_id: 7, reason_id: 3, unlimited_quantity: null },
        { identifier_type: 'id', identifier: '5', quantity: 0, mode: 'overwrite', branch_id: null, reason_id: null, unlimited_quantity: true },
      ],
    });
  });

  it('validates every line before calling Salla', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(
      sallaProducts.adjustStock({ auth, input: { lines: [{ identifierType: 'id', identifier: 5, quantity: 0, mode: 'increment' }] } }),
    ).rejects.toThrow('Stock line 1: quantity must be greater than 0');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('listProducts', () => {
  it('sends keyword, status, category and per_page 60, and flattens the products', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok({ data: [{ id: 1, price: { amount: 5, currency: 'SAR' } }, 'junk'], pagination: { currentPage: 1, totalPages: 1 } }),
    );
    const result = await sallaProducts.listProducts({ auth, filters: { maxResults: 10, keyword: ' shirt ', status: 'sale', categoryId: 34 } });
    const url = new URL(spy.mock.calls[0][0].url);
    expect(url.pathname).toBe('/admin/v2/products');
    expect(Object.fromEntries(url.searchParams)).toEqual({ keyword: 'shirt', status: 'sale', category: '34', page: '1', per_page: '60' });
    expect(result).toMatchObject({ count: 1, truncated: false });
    expect(result.products[0]).toMatchObject({ id: 1, price_amount: 5 });
  });

  it('leaves out unset filters', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: [] }));
    await sallaProducts.listProducts({ auth, filters: { maxResults: 10, keyword: '' } });
    expect([...new URL(spy.mock.calls[0][0].url).searchParams.keys()]).toEqual(['page', 'per_page']);
  });
});

describe('listVariants', () => {
  it('reads the product and its variants, labelling each from the option values', async () => {
    const spy = mockVariantApi();
    const result = await sallaProducts.listVariants({ auth, productId: '5' });
    expect(spy).toHaveBeenCalledTimes(2);
    const urls = spy.mock.calls.map(([request]) => new URL(request.url));
    expect(urls.map((url) => url.pathname).sort()).toEqual(['/admin/v2/products/5', '/admin/v2/products/5/variants']);
    const variantUrl = urls.find((url) => url.pathname.endsWith('/variants'));
    expect(variantUrl?.searchParams.get('per_page')).toBe('60');
    expect(result.count).toBe(3);
    expect(result.truncated).toBe(false);
    expect(result.variants.map((entry) => entry['label'])).toEqual(['Red / M · TS-RED-M', 'Blue', 'Variant 13']);
    expect(result.variants[0]).toMatchObject({ id: 11, product_id: 5, option_values: 'Red / M', price_amount: 120, stock_quantity_number: 5 });
  });

  it('rejects a bad product ID before calling Salla', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await expect(sallaProducts.listVariants({ auth, productId: 'abc' })).rejects.toThrow('Product ID must be a numeric');
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('updateVariant and updateProductPrice', () => {
  it('PUTs the variant body to /products/variants/{id}', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { id: 11, sku: 'S-1', price: { amount: 9, currency: 'SAR' } } }));
    const result = await sallaProducts.updateVariant({ auth, variantId: '11', input: { price: '9', mpn: '007' } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.PUT, url: `${BASE_URL}/products/variants/11`, body: { price: 9, mpn: '007' } });
    expect(result).toMatchObject({ id: 11, label: 'Variant 11 · S-1', price_amount: 9 });
  });

  it('fills product_id in the output when the product ID is given or Salla returns it', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { id: 11 } }));
    const withProduct = await sallaProducts.updateVariant({ auth, variantId: '11', productId: '1672932878', input: { price: '9' } });
    const withoutProduct = await sallaProducts.updateVariant({ auth, variantId: '11', input: { price: '9' } });
    expect(withProduct['product_id']).toBe(1672932878);
    expect(withoutProduct['product_id']).toBeNull();
  });

  it('names the option values from the product that Salla reports for the variant', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      if (pathOf(request) === '/products/5') {
        return ok({ data: productWithOptions });
      }
      return ok({ data: { id: 11, sku: 'S-1', product_id: 5, related_option_values: [101, 201] } });
    });
    const result = await sallaProducts.updateVariant({ auth, variantId: '11', input: { price: '9' } });
    expect(spy.mock.calls.map(([request]) => `${request.method} ${pathOf(request)}`)).toEqual(['PUT /products/variants/11', 'GET /products/5']);
    expect(result).toMatchObject({ id: 11, product_id: 5, option_values: 'Red / M', label: 'Red / M · S-1' });
  });

  it('still returns the updated variant when the product cannot be read', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      if (pathOf(request) === '/products/5') {
        throw new HttpError({}, { status: 404, responseBody: { error: { message: 'Not found' } } });
      }
      return ok({ data: { id: 11, sku: 'S-1', related_option_values: [101] } });
    });
    const result = await sallaProducts.updateVariant({ auth, variantId: '11', productId: 5, input: { price: '9' } });
    expect(result).toMatchObject({ id: 11, product_id: 5, option_values: null, label: 'Variant 11 · S-1' });
  });

  it('uses the price request builder for the call', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: { id: 1 } }));
    await sallaProducts.updateProductPrice({ auth, store: fakeStore().store, input: { sku: 'TS-1', price: 10 } });
    await sallaProducts.updateProductPrice({ auth, store: fakeStore().store, input: { sku: 'TS-1', price: 10, costPrice: 4 } });
    expect(spy.mock.calls[0][0]).toMatchObject({ method: HttpMethod.POST, url: `${BASE_URL}/products/sku/TS-1/price`, body: { price: 10 } });
    expect(spy.mock.calls[1][0]).toMatchObject({ method: HttpMethod.GET, url: `${BASE_URL}/products/sku/TS-1` });
    expect(spy.mock.calls[2][0]).toMatchObject({ method: HttpMethod.PUT, url: `${BASE_URL}/products/sku/TS-1`, body: { price: 10, cost_price: 4 } });
  });
});

describe('addProductImage', () => {
  it('POSTs a native FormData body with a long timeout', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok({ data: { id: 3, image: { original: { url: 'https://cdn.example.com/o.jpg' }, thumbnail: { url: 'https://cdn.example.com/t.jpg' } } } }),
    );
    const result = await sallaProducts.addProductImage({ auth, productId: 5, source: { type: 'url', url: 'https://cdn.example.com/a.jpg' }, main: true });
    const sent = spy.mock.calls[0][0];
    expect(sent.method).toBe(HttpMethod.POST);
    expect(sent.url).toBe(`${BASE_URL}/products/5/images`);
    expect(sent.body).toBeInstanceOf(FormData);
    if (!(sent.body instanceof FormData)) {
      throw new Error('expected FormData');
    }
    expect(sent.body.get('original')).toBe('https://cdn.example.com/a.jpg');
    expect(sent.body.get('main')).toBe('1');
    expect(sent.timeout).toBe(60000);
    expect(result).toMatchObject({ id: 3, product_id: 5, url: 'https://cdn.example.com/o.jpg', thumbnail_url: 'https://cdn.example.com/t.jpg' });
  });
});

describe('listCategories, listBrands and listStockChangeReasons', () => {
  it('flattens categories and passes the keyword', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok({ data: [{ id: 1, name: 'Clothes', sub_categories: [{ id: 2, name: 'Shirts' }] }] }),
    );
    const result = await sallaProducts.listCategories({ auth, keyword: ' shirt ' });
    const url = new URL(spy.mock.calls[0][0].url);
    expect(url.pathname).toBe('/admin/v2/categories');
    expect(url.searchParams.get('keyword')).toBe('shirt');
    expect(result.categories.map((entry) => entry.path)).toEqual(['Clothes', 'Clothes > Shirts']);
    expect(result.count).toBe(2);
  });

  it('lists brands and stock change reasons, dropping non-objects', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) =>
      pathOf(request) === '/brands' ? ok({ data: [{ id: 1, name: 'Acme' }, 'junk'] }) : ok({ data: [{ id: 4, name: 'Restock' }, null] }),
    );
    const brands = await sallaProducts.listBrands({ auth });
    const reasons = await sallaProducts.listStockChangeReasons({ auth });
    expect(brands).toEqual({ brands: [{ id: 1, name: 'Acme' }], count: 1, truncated: false });
    expect(reasons).toEqual({ reasons: [{ id: 4, name: 'Restock' }], count: 1, truncated: false });
    expect(new URL(spy.mock.calls[0][0].url).searchParams.has('keyword')).toBe(false);
    expect(pathOf(spy.mock.calls[1][0])).toBe('/products/quantities/quantity-change-reason');
  });
});

describe('variantOptions dropdown', () => {
  it('asks to connect first, or to pick a product first, without calling Salla', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    expect(await sallaProps.variantOptions({ auth: undefined, productId: '5' })).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Connect your Salla account first.',
    });
    for (const productId of [undefined, '', ' ', 'abc', null]) {
      expect(await sallaProps.variantOptions({ auth, productId })).toEqual({ disabled: true, options: [], placeholder: 'Pick a product first.' });
    }
    expect(spy).not.toHaveBeenCalled();
  });

  it('lists the variants with option-value labels', async () => {
    mockVariantApi();
    expect(await sallaProps.variantOptions({ auth, productId: 5 })).toEqual({
      disabled: false,
      options: [
        { label: 'Red / M · TS-RED-M', value: '11' },
        { label: 'Blue', value: '12' },
        { label: 'Variant 13', value: '13' },
      ],
      placeholder: undefined,
    });
  });

  it('explains an empty variant list and a failed load', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) =>
      pathOf(request).endsWith('/variants') ? ok({ data: [] }) : ok({ data: { id: 5 } }),
    );
    const empty = await sallaProps.variantOptions({ auth, productId: '5' });
    expect(empty.options).toEqual([]);
    expect(empty.placeholder).toContain('This product has no variants');
    vi.restoreAllMocks();
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new HttpError({}, { status: 401, responseBody: { error: { message: 'Unauthorized' } } }));
    const failed = await sallaProps.variantOptions({ auth, productId: '5' });
    expect(failed.disabled).toBe(true);
    expect(failed.placeholder).toContain('Could not load options: Salla rejected the access token');
  });
});

describe('categoryOptions dropdown', () => {
  it('labels categories with their full path', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(
      ok({ data: [{ id: 1, name: 'Clothes', sub_categories: [{ id: 2, name: 'Shirts' }] }, { id: 3, name: 'Shoes' }] }),
    );
    expect(await sallaProps.categoryOptions({ auth })).toEqual({
      disabled: false,
      options: [
        { label: 'Clothes', value: '1' },
        { label: 'Clothes > Shirts', value: '2' },
        { label: 'Shoes', value: '3' },
      ],
      placeholder: undefined,
    });
  });

  it('handles no connection, no categories and a load error', async () => {
    expect((await sallaProps.categoryOptions({ auth: undefined })).placeholder).toBe('Connect your Salla account first.');
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ data: [] }));
    expect((await sallaProps.categoryOptions({ auth })).placeholder).toContain('No categories found');
    vi.restoreAllMocks();
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(new Error('socket hang up'));
    expect(await sallaProps.categoryOptions({ auth })).toEqual({
      disabled: true,
      options: [],
      placeholder: 'Could not load options from Salla. Check the connection and try again.',
    });
  });
});
