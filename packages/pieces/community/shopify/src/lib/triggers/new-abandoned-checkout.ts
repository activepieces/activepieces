import {
  Polling,
  DedupeStrategy,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  Store,
  TriggerStrategy,
  createTrigger,
  isNil,
} from '@activepieces/pieces-framework';
import { ABANDONED_CHECKOUTS_PAGE_LIMIT, getAbandonedCheckouts } from '../common';
import { shopifyAuth } from '../..';
import { ShopifyAuth, ShopifyCheckout } from '../common/types';

export const newAbandonedCheckout = createTrigger({
  name: 'new_abandoned_checkout',
  classification: 'READ',
  auth: shopifyAuth,
  displayName: 'New Abandoned Checkout',
  description: 'Triggers when a checkout is abandoned.',
  aiMetadata: {
    description:
      'Fires when a shopper adds items to their cart and begins the Shopify checkout but leaves without completing the purchase. Each event represents one abandoned checkout, including the line items, contact details, and recovery URL, enabling cart-recovery and follow-up workflows. Detected via polling, so there may be a delay before an abandoned checkout surfaces.',
  },
  props: {},
  sampleData: {
    id: 450789469,
    token: 'example-checkout-token',
    cart_token: 'example-cart-token',
    email: 'bob.norman@mail.example.com',
    buyer_accepts_marketing: false,
    created_at: '2026-10-12T07:05:27-04:00',
    updated_at: '2026-10-12T07:05:27-04:00',
    completed_at: null,
    closed_at: null,
    currency: 'USD',
    presentment_currency: 'USD',
    customer_locale: 'en',
    name: '#450789469',
    source_name: 'web',
    abandoned_checkout_url:
      'https://example.myshopify.com/548380009/checkouts/ac/example-checkout-token/recover',
    line_items: [
      {
        key: 'example-line-item-key',
        product_id: 632910392,
        variant_id: 49148385,
        title: 'IPod Nano - 8GB',
        variant_title: 'Red',
        sku: 'IPOD2008RED',
        vendor: 'Apple',
        quantity: 1,
        price: '199.00',
        line_price: '199.00',
        requires_shipping: true,
        taxable: true,
      },
    ],
    shipping_lines: [
      {
        code: 'Free Shipping',
        price: '0.00',
        source: 'shopify',
        title: 'Free Shipping',
      },
    ],
    discount_codes: [{ code: 'TENOFF', amount: '39.80', type: 'percentage' }],
    total_line_items_price: '398.00',
    total_discounts: '39.80',
    subtotal_price: '358.20',
    total_tax: '0.00',
    total_price: '358.20',
    taxes_included: false,
    billing_address: {
      first_name: 'Bob',
      last_name: 'Norman',
      name: 'Bob Norman',
      address1: 'Chestnut Street 92',
      address2: '',
      city: 'Louisville',
      province: 'Kentucky',
      province_code: 'KY',
      country: 'United States',
      country_code: 'US',
      zip: '40202',
      phone: '+1(502)-459-2181',
    },
    shipping_address: {
      first_name: 'Bob',
      last_name: 'Norman',
      name: 'Bob Norman',
      address1: 'Chestnut Street 92',
      address2: '',
      city: 'Louisville',
      province: 'Kentucky',
      province_code: 'KY',
      country: 'United States',
      country_code: 'US',
      zip: '40202',
      phone: '+1(502)-459-2181',
    },
    customer: {
      id: 207119551,
      email: 'bob.norman@mail.example.com',
      first_name: 'Bob',
      last_name: 'Norman',
      phone: '+16136120707',
      verified_email: true,
      currency: 'USD',
      admin_graphql_api_id: 'gid://shopify/Customer/207119551',
    },
  },
  type: TriggerStrategy.POLLING,
  async onEnable({ auth, store }) {
    const enabledAt = Date.now();
    const scan = await scanForNewest({
      auth,
      fromId: undefined,
      enabledAt: undefined,
    });
    await saveScan({ store, scan, enabledAt });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    const { auth, store } = context;
    const scanCursor = await store.get<number>(SCAN_CURSOR_KEY);
    if (!isNil(scanCursor)) {
      const enabledAt = (await store.get<number>(SCAN_ENABLED_AT_KEY)) ?? undefined;
      const scan = await scanForNewest({ auth, fromId: scanCursor, enabledAt });
      await saveScan({ store, scan, enabledAt });
      return sortNewestFirst({ checkouts: scan.createdAfterEnable });
    }
    if (isNil(await store.get(LAST_ITEM_KEY))) {
      await store.put(LAST_ITEM_KEY, READ_FROM_FIRST_CHECKOUT);
    }
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
});

const polling: Polling<ShopifyAuth, unknown> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, lastItemId }) => {
    const sinceId = toSinceId({ lastItemId });
    const checkouts = isNil(sinceId)
      ? (await scanForNewest({ auth, fromId: undefined, enabledAt: undefined }))
          .checkouts
      : await getAbandonedCheckouts(auth, { sinceId });
    return sortNewestFirst({ checkouts }).map((checkout) => ({
      id: checkout.id,
      data: checkout,
    }));
  },
};

async function scanForNewest({
  auth,
  fromId,
  enabledAt,
}: {
  auth: ShopifyAuth;
  fromId: number | undefined;
  enabledAt: number | undefined;
}): Promise<NewestCheckoutScan> {
  let page = await getAbandonedCheckouts(auth, {
    sinceId: isNil(fromId) ? '' : String(fromId),
  });
  let newestId = page.length > 0 ? maxId({ checkouts: page }) : fromId;
  let createdAfterEnable = createdSince({ checkouts: page, since: enabledAt });
  for (
    let hop = 0;
    hop < MAX_PAGES_TO_FIND_NEWEST &&
    page.length >= ABANDONED_CHECKOUTS_PAGE_LIMIT;
    hop++
  ) {
    const next = await getAbandonedCheckouts(auth, {
      sinceId: String(newestId),
    });
    if (next.length === 0) {
      return { checkouts: page, newestId, complete: true, createdAfterEnable };
    }
    page = next;
    newestId = maxId({ checkouts: page });
    createdAfterEnable = [
      ...createdAfterEnable,
      ...createdSince({ checkouts: page, since: enabledAt }),
    ];
  }
  return {
    checkouts: page,
    newestId,
    complete: page.length < ABANDONED_CHECKOUTS_PAGE_LIMIT,
    createdAfterEnable,
  };
}

async function saveScan({
  store,
  scan,
  enabledAt,
}: {
  store: Store;
  scan: NewestCheckoutScan;
  enabledAt: number | undefined;
}): Promise<void> {
  if (!scan.complete) {
    await store.put(SCAN_CURSOR_KEY, scan.newestId);
    if (!isNil(enabledAt)) {
      await store.put(SCAN_ENABLED_AT_KEY, enabledAt);
    }
    await store.delete(LAST_ITEM_KEY);
    return;
  }
  await store.delete(SCAN_CURSOR_KEY);
  await store.delete(SCAN_ENABLED_AT_KEY);
  if (isNil(scan.newestId)) {
    await store.delete(LAST_ITEM_KEY);
    return;
  }
  await store.put(LAST_ITEM_KEY, scan.newestId);
}

function toSinceId({ lastItemId }: { lastItemId: unknown }): string | undefined {
  if (typeof lastItemId === 'number' || typeof lastItemId === 'string') {
    return String(lastItemId);
  }
  return undefined;
}

function sortNewestFirst({
  checkouts,
}: {
  checkouts: ShopifyCheckout[];
}): ShopifyCheckout[] {
  return [...checkouts].sort((a, b) => b.id - a.id);
}

function maxId({ checkouts }: { checkouts: ShopifyCheckout[] }): number {
  return checkouts.reduce((max, checkout) => Math.max(max, checkout.id), 0);
}

function createdSince({
  checkouts,
  since,
}: {
  checkouts: ShopifyCheckout[];
  since: number | undefined;
}): ShopifyCheckout[] {
  if (isNil(since)) {
    return [];
  }
  return checkouts.filter(
    (checkout) => Date.parse(checkout.created_at) >= since
  );
}

const MAX_PAGES_TO_FIND_NEWEST = 40;
const LAST_ITEM_KEY = 'lastItem';
const SCAN_CURSOR_KEY = 'newestCheckoutScanCursor';
const SCAN_ENABLED_AT_KEY = 'newestCheckoutScanEnabledAt';
const READ_FROM_FIRST_CHECKOUT = 0;

type NewestCheckoutScan = {
  checkouts: ShopifyCheckout[];
  newestId: number | undefined;
  complete: boolean;
  createdAfterEnable: ShopifyCheckout[];
};
