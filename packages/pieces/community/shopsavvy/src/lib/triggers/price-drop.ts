import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

import { shopsavvyAuth } from '../common/auth';
import {
  getCurrentOffers,
  ShopSavvyOffer,
  ShopSavvyProductWithOffers,
} from '../common/client';

export const priceDropTrigger = createTrigger({
  auth: shopsavvyAuth,
  name: 'price-drop',
  displayName: 'Price Drop',
  description:
    'Triggers when the lowest price for a product drops below a threshold or decreases from its previous value.',
  type: TriggerStrategy.POLLING,
  props: {
    identifier: Property.ShortText({
      displayName: 'Product Identifier',
      description:
        'Barcode/UPC, Amazon ASIN, product URL, model number, or product name.',
      required: true,
    }),
    targetPrice: Property.Number({
      displayName: 'Target Price',
      description:
        'Trigger when the lowest price drops to or below this amount. Leave empty to trigger on any price decrease.',
      required: false,
    }),
    retailer: Property.ShortText({
      displayName: 'Retailer',
      description:
        'Optional retailer domain to monitor (e.g. "amazon.com").',
      required: false,
    }),
  },
  sampleData: {
    product: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
    previousLowestPrice: 349.99,
    currentLowestPrice: 299.99,
    savings: 50.0,
    offer: {
      retailer: 'Amazon',
      price: 299.99,
      currency: 'USD',
      availability: 'In Stock',
      url: 'https://amazon.com/dp/B09XS7JWHH',
    },
    detectedAt: '2026-04-01T12:00:00Z',
  },
  async test({ auth, propsValue, store, files }) {
    return await pollingHelper.test(polling, {
      auth,
      store,
      propsValue,
      files,
    });
  },
  async onEnable({ auth, propsValue, store }) {
    await pollingHelper.onEnable(polling, {
      auth,
      store,
      propsValue,
    });
  },
  async onDisable({ auth, propsValue, store }) {
    await pollingHelper.onDisable(polling, {
      auth,
      store,
      propsValue,
    });
  },
  async run({ auth, propsValue, store, files }) {
    return await pollingHelper.poll(polling, {
      auth,
      store,
      propsValue,
      files,
    });
  },
});

const polling: Polling<
  string,
  {
    identifier: string;
    targetPrice: number | undefined;
    retailer: string | undefined;
  }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, store }) => {
    const previousLowestPrice = await store.get<number>(
      '_shopsavvy_lowest_price',
    );

    const response = await getCurrentOffers({
      apiKey: auth,
      identifier: propsValue.identifier,
      retailer: propsValue.retailer,
    });

    const allOffers: Array<{
      productTitle: string;
      offer: ShopSavvyOffer;
    }> = [];

    for (const product of response.data) {
      for (const offer of product.offers) {
        if (offer.price !== null && offer.price !== undefined) {
          allOffers.push({
            productTitle: product.title,
            offer,
          });
        }
      }
    }

    if (allOffers.length === 0) {
      return [];
    }

    allOffers.sort(
      (a, b) => (a.offer.price ?? Infinity) - (b.offer.price ?? Infinity),
    );

    const lowestOffer = allOffers[0];
    const currentLowestPrice = lowestOffer.offer.price!;

    // Store the current lowest price for next poll
    await store.put('_shopsavvy_lowest_price', currentLowestPrice);

    // Determine if this is a price drop
    let isPriceDrop = false;

    if (propsValue.targetPrice !== undefined) {
      // Target price mode: trigger when at or below target
      isPriceDrop = currentLowestPrice <= propsValue.targetPrice;
    } else if (previousLowestPrice !== null) {
      // Any decrease mode: trigger when price decreased
      isPriceDrop = currentLowestPrice < previousLowestPrice;
    }

    if (!isPriceDrop) {
      return [];
    }

    const now = new Date().toISOString();

    return [
      {
        id: `${currentLowestPrice}-${now}`,
        data: {
          product: lowestOffer.productTitle,
          previousLowestPrice: previousLowestPrice ?? currentLowestPrice,
          currentLowestPrice,
          savings:
            previousLowestPrice !== null
              ? Math.round(
                  (previousLowestPrice - currentLowestPrice) * 100,
                ) / 100
              : 0,
          offer: {
            retailer: lowestOffer.offer.retailer,
            price: lowestOffer.offer.price,
            currency: lowestOffer.offer.currency,
            availability: lowestOffer.offer.availability,
            url: lowestOffer.offer.URL,
          },
          detectedAt: now,
        },
      },
    ];
  },
};
