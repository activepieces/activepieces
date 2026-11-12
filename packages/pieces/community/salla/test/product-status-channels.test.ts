import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { Store, StoreScope } from '@activepieces/pieces-framework';
import { sallaProducts } from '../src/lib/common/products';

const auth = { access_token: 'token' };

afterEach(() => {
  vi.restoreAllMocks();
});

function pathOf(request: HttpRequest): string {
  return new URL(request.url).pathname.replace('/admin/v2', '');
}

function memoryStore(): Store {
  const saved = new Map<string, string>();
  return {
    async put<T>(key: string, value: T, _scope?: StoreScope): Promise<T> {
      saved.set(key, JSON.stringify(value));
      return value;
    },
    async get<T>(key: string, _scope?: StoreScope): Promise<T | null> {
      const raw = saved.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    async delete(key: string, _scope?: StoreScope): Promise<void> {
      saved.delete(key);
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toStatus(value: unknown): ProductState['status'] {
  if (value === 'sale' || value === 'out' || value === 'hidden') {
    return value;
  }
  throw new Error(`unexpected status ${String(value)}`);
}

function channelsIn(operations: unknown): string[] {
  const first = Array.isArray(operations) ? operations[0] : undefined;
  const value = isRecord(first) ? first['value'] : undefined;
  const channels = isRecord(value) ? value['channels'] : undefined;
  return Array.isArray(channels) ? channels.filter((channel): channel is string => typeof channel === 'string') : [];
}

function fakeSalla({ status, channels, putResetsChannels = false }: ProductState & { putResetsChannels?: boolean }) {
  const product: ProductState = { status, channels: [...channels] };
  const calls: string[] = [];
  const reply = (code: number) => ({ status: code, headers: {}, body: { data: { id: 9, name: 'Cup', status: product.status, channels: [...product.channels] } } });
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    const path = pathOf(request);
    calls.push(`${request.method} ${path}`);
    const body = isRecord(request.body) ? request.body : {};
    if (request.method === HttpMethod.POST && path === '/products/9/status') {
      const next = toStatus(body['status']);
      product.status = next;
      product.channels = next === 'hidden' ? [] : next === 'sale' ? ['web'] : product.channels;
      return { status: 201, headers: {}, body: { data: { message: 'updated' } } };
    }
    if (request.method === HttpMethod.POST && path === '/products/actions') {
      product.channels = channelsIn(body['operations']);
      product.status = 'sale';
      return { status: 200, headers: {}, body: { success: true } };
    }
    if (request.method === HttpMethod.PUT) {
      if (body['status'] === 'hidden') {
        product.status = 'hidden';
        product.channels = [];
      } else if (putResetsChannels && product.status !== 'hidden') {
        product.channels = ['web'];
      }
      return reply(201);
    }
    return reply(200);
  });
  return { product, calls };
}

describe('Change Product Status keeps the sales channels', () => {
  it('puts web and app back when a hidden product goes on sale again', async () => {
    const store = memoryStore();
    const salla = fakeSalla({ status: 'sale', channels: ['web', 'app'] });
    await sallaProducts.changeProductStatus({ auth, productId: 9, status: 'hidden', store });
    expect(salla.product).toEqual({ status: 'hidden', channels: [] });
    const result = await sallaProducts.changeProductStatus({ auth, productId: 9, status: 'sale', store });
    expect(salla.product).toEqual({ status: 'sale', channels: ['web', 'app'] });
    expect(result).toMatchObject({ product_id: 9, status: 'sale' });
  });

  it('keeps web and app when a product already on sale is set to sale again', async () => {
    const salla = fakeSalla({ status: 'sale', channels: ['web', 'app'] });
    await sallaProducts.changeProductStatus({ auth, productId: 9, status: 'sale', store: memoryStore() });
    expect(salla.product).toEqual({ status: 'sale', channels: ['web', 'app'] });
  });

  it('ends out of stock, not on sale, when a hidden product is marked out of stock', async () => {
    const store = memoryStore();
    const salla = fakeSalla({ status: 'sale', channels: ['web', 'app'] });
    await sallaProducts.changeProductStatus({ auth, productId: 9, status: 'hidden', store });
    await sallaProducts.changeProductStatus({ auth, productId: 9, status: 'out', store });
    expect(salla.product).toEqual({ status: 'out', channels: ['web', 'app'] });
  });

  it('makes no channel call when a product on sale is marked out of stock', async () => {
    const salla = fakeSalla({ status: 'sale', channels: ['web', 'app'] });
    await sallaProducts.changeProductStatus({ auth, productId: 9, status: 'out', store: memoryStore() });
    expect(salla.product).toEqual({ status: 'out', channels: ['web', 'app'] });
    expect(salla.calls).not.toContain('POST /products/actions');
  });

  it('leaves a product hidden outside Activepieces on the web store only, as Salla does', async () => {
    const salla = fakeSalla({ status: 'hidden', channels: [] });
    await sallaProducts.changeProductStatus({ auth, productId: 9, status: 'sale', store: memoryStore() });
    expect(salla.product).toEqual({ status: 'sale', channels: ['web'] });
    expect(salla.calls).not.toContain('POST /products/actions');
  });

  it('does not save a hidden record twice when the product is already hidden', async () => {
    const store = memoryStore();
    const salla = fakeSalla({ status: 'sale', channels: ['web', 'app'] });
    await sallaProducts.changeProductStatus({ auth, productId: 9, status: 'hidden', store });
    await sallaProducts.changeProductStatus({ auth, productId: 9, status: 'hidden', store });
    await sallaProducts.changeProductStatus({ auth, productId: 9, status: 'sale', store });
    expect(salla.product).toEqual({ status: 'sale', channels: ['web', 'app'] });
  });

  it('says the status changed but the channels did not when the restore fails', async () => {
    const store = memoryStore();
    fakeSalla({ status: 'sale', channels: ['web', 'app'] });
    await sallaProducts.changeProductStatus({ auth, productId: 9, status: 'hidden', store });
    const send = vi.mocked(httpClient.sendRequest);
    const fake = send.getMockImplementation();
    send.mockImplementation(async (request: HttpRequest) => {
      if (pathOf(request) === '/products/actions') {
        throw new Error('channels down');
      }
      return fake ? fake(request) : { status: 200, headers: {}, body: {} };
    });
    await expect(sallaProducts.changeProductStatus({ auth, productId: 9, status: 'sale', store })).rejects.toThrow(
      'The product status is now "sale", but Salla changed its sales channels to web and putting back web, app failed',
    );
  });
});

describe('Update Product status keeps the product as asked', () => {
  it('leaves the product hidden when Update Product hides it', async () => {
    const salla = fakeSalla({ status: 'sale', channels: ['web', 'app'] });
    const result = await sallaProducts.updateProduct({ auth, store: memoryStore(), by: 'id', value: 9, input: { name: 'Cup', status: 'hidden' } });
    expect(salla.product).toEqual({ status: 'hidden', channels: [] });
    expect(result).toMatchObject({ id: 9, status: 'hidden' });
  });

  it('shows a product hidden by Update Product again with its channels', async () => {
    const store = memoryStore();
    const salla = fakeSalla({ status: 'sale', channels: ['web', 'app'] });
    await sallaProducts.updateProduct({ auth, store, by: 'id', value: 9, input: { status: 'hidden' } });
    const result = await sallaProducts.updateProduct({ auth, store, by: 'id', value: 9, input: { status: 'sale' } });
    expect(salla.product).toEqual({ status: 'sale', channels: ['web', 'app'] });
    expect(result).toMatchObject({ status: 'sale', channels: ['web', 'app'] });
    expect(salla.calls.filter((call) => call.startsWith('PUT'))).toEqual([]);
  });

  it('sends no status in the product PUT', async () => {
    fakeSalla({ status: 'sale', channels: ['web'] });
    await sallaProducts.updateProduct({ auth, store: memoryStore(), by: 'id', value: 9, input: { name: 'Cup', status: 'out' } });
    const put = vi.mocked(httpClient.sendRequest).mock.calls.map(([request]) => request).find((request) => request.method === HttpMethod.PUT);
    expect(put?.body).toEqual({ name: 'Cup' });
  });

  it('keeps an out of stock product out of stock when its channels are put back', async () => {
    const salla = fakeSalla({ status: 'out', channels: ['web', 'app'], putResetsChannels: true });
    await sallaProducts.updateProduct({ auth, store: memoryStore(), by: 'id', value: 9, input: { name: 'Cup' } });
    expect(salla.product).toEqual({ status: 'out', channels: ['web', 'app'] });
  });
});

type ProductState = { status: 'sale' | 'out' | 'hidden'; channels: string[] };
