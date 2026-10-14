import {
  Polling,
  DedupeStrategy,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
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
  async onEnable({ auth, propsValue, store }) {
    await pollingHelper.onEnable(polling, { auth, propsValue, store });
  },
  async onDisable({ auth, propsValue, store }) {
    await pollingHelper.onDisable(polling, { auth, propsValue, store });
  },
  async run({ auth, propsValue, store, files }) {
    if (isNil(await store.get(LAST_ITEM_KEY))) {
      await store.put(LAST_ITEM_KEY, READ_FROM_FIRST_CHECKOUT);
    }
    return await pollingHelper.poll(polling, { auth, propsValue, store, files });
  },
  async test({ auth, propsValue, store, files }) {
    return await pollingHelper.test(polling, { auth, propsValue, store, files });
  },
});

const polling: Polling<ShopifyAuth, unknown> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, lastItemId }) => {
    const sinceId = toSinceId({ lastItemId });
    const checkouts = isNil(sinceId)
      ? await getNewestCheckouts({ auth })
      : await getAbandonedCheckouts(auth, { sinceId });
    return sortNewestFirst({ checkouts }).map((checkout) => ({
      id: checkout.id,
      data: checkout,
    }));
  },
};

async function getNewestCheckouts({
  auth,
}: {
  auth: ShopifyAuth;
}): Promise<ShopifyCheckout[]> {
  let page = await getAbandonedCheckouts(auth, { sinceId: '' });
  for (
    let hop = 0;
    hop < MAX_PAGES_TO_FIND_NEWEST &&
    page.length >= ABANDONED_CHECKOUTS_PAGE_LIMIT;
    hop++
  ) {
    const next = await getAbandonedCheckouts(auth, {
      sinceId: String(maxId({ checkouts: page })),
    });
    if (next.length === 0) {
      return page;
    }
    page = next;
  }
  return page;
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

const MAX_PAGES_TO_FIND_NEWEST = 40;
const LAST_ITEM_KEY = 'lastItem';
const READ_FROM_FIRST_CHECKOUT = 0;
