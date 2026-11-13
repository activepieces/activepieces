import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, AppConnectionValueForAuthProperty, createMockActionContext } from '@activepieces/pieces-framework';
import { aiListProductsAction } from '../src/lib/actions/ai/list-products';
import { findProductsAction } from '../src/lib/actions/find-products';
import { sallaAuth } from '../src/lib/auth';
import { productSummaryKeys } from '../src/lib/common/output-schemas';

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

const FULL_PRODUCT = {
  id: 1764656014,
  name: 'T-Shirt',
  sku: 'TSHIRT-RED-M',
  type: 'product',
  status: 'sale',
  quantity: 12,
  unlimited_quantity: false,
  is_available: true,
  sold_quantity: 3,
  price: { amount: 100, currency: 'SAR' },
  description: '<p>Soft cotton</p>',
  images: [{ id: 1, url: 'https://cdn.salla.sa/a.png', main: true }],
  options: [{ id: 2, name: 'Size', values: [{ id: 3, name: 'M' }] }],
  skus: [{ id: 4, sku: 'TSHIRT-RED-M', stock_quantity: 12 }],
};

function mockProducts() {
  vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
    status: 200,
    headers: {},
    body: { data: [FULL_PRODUCT], pagination: { currentPage: 1, totalPages: 1 } },
  });
}

function asList(value: unknown): { products: Record<string, unknown>[]; count: unknown; truncated: unknown } {
  if (typeof value !== 'object' || value === null || !('products' in value) || !Array.isArray(value.products)) {
    throw new Error('expected a product list');
  }
  const products = value.products.filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null);
  return { products, count: 'count' in value ? value.count : undefined, truncated: 'truncated' in value ? value.truncated : undefined };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AI List Products summary', () => {
  it('returns only the summary keys for each product', async () => {
    mockProducts();
    const propsValue = { keyword: undefined, status: undefined, category_id: undefined, max_results: 20 };
    const result = asList(await aiListProductsAction.run({ ...createMockActionContext<typeof aiListProductsAction.props>({ propsValue }), auth: AUTH }));
    expect(result.count).toBe(1);
    expect(result.truncated).toBe(false);
    const product = result.products[0];
    expect(Object.keys(product).every((key) => productSummaryKeys.includes(key))).toBe(true);
    expect(product).not.toHaveProperty('images');
    expect(product).not.toHaveProperty('options');
    expect(product).not.toHaveProperty('skus');
    expect(product).not.toHaveProperty('description');
    expect(product).toMatchObject({ id: 1764656014, sku: 'TSHIRT-RED-M', status: 'sale', quantity: 12, price_amount: 100, sold_quantity: 3 });
  });

  it('keeps full products on the human Find Products action', async () => {
    mockProducts();
    const propsValue = { keyword: undefined, status: undefined, category: undefined, max_results: 20 };
    const result = asList(await findProductsAction.run({ ...createMockActionContext<typeof findProductsAction.props>({ propsValue }), auth: AUTH }));
    expect(result.products[0]).toMatchObject({ images: FULL_PRODUCT.images, options: FULL_PRODUCT.options, skus: FULL_PRODUCT.skus });
  });
});
