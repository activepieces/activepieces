import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { SallaAuth } from '../common/client';
import { sallaUtils } from '../common/helpers';
import { ProductStatus, sallaProducts } from '../common/products';
import { SallaWebhookEvent, sallaWebhooks } from '../common/webhooks';
import { sallaOrderTriggers } from './order-event-trigger';

export const sallaProductTriggers = {
  enable: sallaOrderTriggers.enable,
  disable: sallaOrderTriggers.disable,
  receive: sallaOrderTriggers.receive,
  productOutput,
  testProductOutputs,
  testLowStockOutputs,
  testPriceStatusOutputs,
  requirePriceStatusEvent,
  productSample,
  lowStockSample,
  priceStatusSample,
};

function productOutput(event: SallaWebhookEvent): Record<string, unknown> {
  return {
    ...sallaProducts.withProductExtras(event.data),
    salla_event: eventMeta(event),
    [DEDUPE_KEY_PROPERTY]: sallaWebhooks.dedupeKey(event),
  };
}

async function testProductOutputs({
  auth,
  event,
  status,
}: {
  auth: SallaAuth;
  event: string;
  status?: ProductStatus;
}): Promise<Record<string, unknown>[]> {
  const { products } = await sallaProducts.listProducts({ auth, filters: { maxResults: TEST_PRODUCT_COUNT, status } });
  return products.map((product) => ({ ...product, salla_event: testEventMeta(event) }));
}

async function testLowStockOutputs({ auth }: { auth: SallaAuth }): Promise<Record<string, unknown>[]> {
  const { products: outOfStock } = await sallaProducts.listProducts({
    auth,
    filters: { maxResults: TEST_PRODUCT_COUNT, status: 'out' },
  });
  const picked = [...outOfStock];
  if (picked.length < TEST_PRODUCT_COUNT) {
    const { products: recent } = await sallaProducts.listProducts({ auth, filters: { maxResults: LOW_STOCK_SCAN_COUNT } });
    const pickedIds = new Set(picked.map(idKey));
    const lowest = recent
      .filter((product) => !pickedIds.has(idKey(product)) && product['unlimited_quantity'] !== true && quantityOf(product) !== undefined)
      .sort((a, b) => (quantityOf(a) ?? 0) - (quantityOf(b) ?? 0));
    picked.push(...lowest.slice(0, TEST_PRODUCT_COUNT - picked.length));
    if (picked.length === 0) {
      picked.push(...recent.slice(0, TEST_PRODUCT_COUNT));
    }
  }
  return picked.map((product) => ({ ...product, salla_event: testEventMeta(PRODUCT_LOW_STOCK_EVENT) }));
}

async function testPriceStatusOutputs({ auth, event }: { auth: SallaAuth; event: PriceStatusEvent }): Promise<Record<string, unknown>[]> {
  const { products } = await sallaProducts.listProducts({ auth, filters: { maxResults: TEST_PRODUCT_COUNT } });
  return products.map((product) => ({
    ...sallaProducts.withProductExtras(priceStatusPayload({ product, event })),
    salla_event: testEventMeta(event),
  }));
}

function priceStatusPayload({ product, event }: { product: Record<string, unknown>; event: PriceStatusEvent }): Record<string, unknown> {
  const base = {
    id: product['id'] ?? null,
    sku: product['sku'] ?? null,
    mpn: product['mpn'] ?? null,
    gtin: product['gtin'] ?? null,
  };
  if (event === PRODUCT_STATUS_UPDATED_EVENT) {
    return { ...base, status: product['status'] ?? null };
  }
  const salePrice = sallaUtils.amountOf(product['sale_price']);
  return {
    ...base,
    cost: sallaUtils.amountOf(product['cost_price']) ?? null,
    starting_price: sallaUtils.amountOf(product['starting_price']) ?? null,
    price: sallaUtils.amountOf(product['price']) ?? null,
    sale_price: salePrice !== undefined && salePrice > 0 ? { amount: salePrice, expired_at: product['sale_end_date'] ?? null } : null,
    tax: sallaUtils.amountOf(product['tax']) ?? null,
    taxed_price: sallaUtils.amountOf(product['taxed_price']) ?? null,
    regular_price: sallaUtils.amountOf(product['regular_price']) ?? null,
    currency: product['currency'] ?? null,
    with_tax: typeof product['with_tax'] === 'boolean' ? product['with_tax'] : null,
  };
}

function requirePriceStatusEvent(value: unknown): PriceStatusEvent {
  const match = PRICE_STATUS_EVENTS.find((event) => event === value);
  if (!match) {
    throw new Error(`"${String(value ?? '')}" is not a supported change. Pick "Price changed" or "Status changed".`);
  }
  return match;
}

function productSample({ event }: { event: string }): Record<string, unknown> {
  return {
    ...sallaProducts.withProductExtras(SAMPLE_PRODUCT),
    salla_event: sampleEventMeta(event),
  };
}

function lowStockSample(): Record<string, unknown> {
  return {
    ...sallaProducts.withProductExtras({ ...SAMPLE_PRODUCT, quantity: 2, notify_quantity: 5 }),
    salla_event: sampleEventMeta(PRODUCT_LOW_STOCK_EVENT),
  };
}

function priceStatusSample({ event }: { event: PriceStatusEvent }): Record<string, unknown> {
  const data = event === PRODUCT_STATUS_UPDATED_EVENT ? SAMPLE_STATUS_PAYLOAD : SAMPLE_PRICE_PAYLOAD;
  return {
    ...sallaProducts.withProductExtras(data),
    salla_event: sampleEventMeta(event),
  };
}

function quantityOf(product: Record<string, unknown>): number | undefined {
  return sallaUtils.amountOf(product['quantity']);
}

function idKey(product: Record<string, unknown>): string {
  const id = product['id'];
  return typeof id === 'number' || typeof id === 'string' ? String(id) : '';
}

function eventMeta(event: SallaWebhookEvent): SallaEventMeta {
  return {
    name: event.event,
    store_id: event.merchant ?? null,
    created_at: event.createdAt ?? null,
  };
}

function testEventMeta(event: string): SallaEventMeta {
  return { name: event, store_id: null, created_at: null };
}

function sampleEventMeta(event: string): SallaEventMeta {
  return { name: event, store_id: SAMPLE_STORE_ID, created_at: SAMPLE_SENT_AT };
}

const TEST_PRODUCT_COUNT = 3;
const LOW_STOCK_SCAN_COUNT = 60;
const PRODUCT_LOW_STOCK_EVENT = 'product.quantity.low';
const PRODUCT_PRICE_UPDATED_EVENT = 'product.price.updated';
const PRODUCT_STATUS_UPDATED_EVENT = 'product.status.updated';
const PRICE_STATUS_EVENTS: PriceStatusEvent[] = [PRODUCT_PRICE_UPDATED_EVENT, PRODUCT_STATUS_UPDATED_EVENT];
const SAMPLE_STORE_ID = 1305146709;
const SAMPLE_SENT_AT = 'Tue Nov 10 2026 12:14:21 GMT+0300';

const SAMPLE_PRODUCT: Record<string, unknown> = {
  id: 1025569331,
  promotion: { title: null, sub_title: null },
  sku: 'TSHIRT-RED-M',
  mpn: null,
  gtin: null,
  type: 'product',
  name: 'Classic Cotton T-Shirt',
  short_link_code: 'aezvrRn',
  urls: {
    customer: 'https://salla.sa/dev-wofftr4xsra5xtlv/classic-cotton-t-shirt/p1025569331',
    admin: 'https://s.salla.sa/products/1025569331',
  },
  price: { amount: 299, currency: 'SAR' },
  taxed_price: { amount: 343.85, currency: 'SAR' },
  pre_tax_price: { amount: 299, currency: 'SAR' },
  tax: { amount: 44.85, currency: 'SAR' },
  description: '<p>Soft cotton t-shirt.</p>',
  quantity: 20,
  status: 'sale',
  is_available: true,
  views: 0,
  sale_price: { amount: 0, currency: 'SAR' },
  sale_end: null,
  require_shipping: true,
  cost_price: null,
  weight: 0.3,
  weight_type: 'kg',
  with_tax: true,
  url: 'https://salla.sa/dev-wofftr4xsra5xtlv/classic-cotton-t-shirt/p1025569331',
  main_image: null,
  images: [],
  sold_quantity: 0,
  rating: { total: 0, count: 0, rate: 0 },
  regular_price: { amount: 299, currency: 'SAR' },
  max_items_per_user: 1,
  maximum_quantity_per_order: null,
  show_in_app: false,
  notify_quantity: null,
  hide_quantity: false,
  unlimited_quantity: false,
  managed_by_branches: false,
  calories: null,
  customized_sku_quantity: false,
  channels: [],
  starting_price: null,
  metadata: { title: null, description: null },
  allow_attachments: false,
  is_pinned: false,
  sort: 0,
  enable_upload_image: false,
  updated_at: '2026-11-10 12:14:21',
  options: [],
  skus: [],
  categories: [{ id: 1207467137, name: 'Clothing' }],
  brand: null,
  tags: [],
};

const SAMPLE_PRICE_PAYLOAD: Record<string, unknown> = {
  id: 1462551237,
  sku: 'PRO-7644',
  mpn: 'MPN888',
  gtin: '38374622',
  cost: 60,
  starting_price: null,
  price: 150,
  sale_price: { amount: 85, expired_at: '2026-12-01' },
  tax: 22.5,
  taxed_price: 172.5,
  regular_price: 150,
  currency: 'SAR',
  with_tax: true,
};

const SAMPLE_STATUS_PAYLOAD: Record<string, unknown> = {
  id: 799860060,
  sku: 'SKU122',
  mpn: 'MPN-093',
  gtin: '88840002',
  status: 'hidden',
};

type PriceStatusEvent = 'product.price.updated' | 'product.status.updated';

type SallaEventMeta = {
  name: string;
  store_id: number | string | null;
  created_at: string | null;
};

export { PRODUCT_LOW_STOCK_EVENT, PRODUCT_PRICE_UPDATED_EVENT, PRODUCT_STATUS_UPDATED_EVENT };
export type { PriceStatusEvent };
