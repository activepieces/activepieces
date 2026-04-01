import { createAction, Property } from '@activepieces/pieces-framework';

import { shopsavvyAuth } from '../common/auth';
import { getCurrentOffers } from '../common/client';

export const getCurrentOffersAction = createAction({
  auth: shopsavvyAuth,
  name: 'get-current-offers',
  displayName: 'Get Current Offers',
  description:
    'Get current prices and offers for a product across retailers.',
  props: {
    identifier: Property.ShortText({
      displayName: 'Product Identifier',
      description:
        'Barcode/UPC, Amazon ASIN, product URL, model number, or product name.',
      required: true,
    }),
    retailer: Property.ShortText({
      displayName: 'Retailer',
      description:
        'Optional retailer domain to filter by (e.g. "amazon.com", "walmart.com").',
      required: false,
    }),
  },
  sampleData: {
    success: true,
    data: [
      {
        title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
        shopsavvy: 'sp_abc123',
        brand: 'Sony',
        offers: [
          {
            id: 'offer_1',
            retailer: 'Amazon',
            price: 299.99,
            currency: 'USD',
            availability: 'In Stock',
            condition: 'New',
            URL: 'https://amazon.com/dp/B09XS7JWHH',
            timestamp: '2026-04-01T12:00:00Z',
          },
          {
            id: 'offer_2',
            retailer: 'Best Buy',
            price: 319.99,
            currency: 'USD',
            availability: 'In Stock',
            condition: 'New',
            URL: 'https://bestbuy.com/product/6505727',
            timestamp: '2026-04-01T11:30:00Z',
          },
        ],
      },
    ],
  },
  async run(context) {
    return await getCurrentOffers({
      apiKey: context.auth,
      identifier: context.propsValue.identifier,
      retailer: context.propsValue.retailer,
    });
  },
});
