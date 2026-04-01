import { createAction, Property } from '@activepieces/pieces-framework';

import { shopsavvyAuth } from '../common/auth';
import { getPriceHistory } from '../common/client';

export const getPriceHistoryAction = createAction({
  auth: shopsavvyAuth,
  name: 'get-price-history',
  displayName: 'Get Price History',
  description:
    'Get historical price data for a product over a date range.',
  props: {
    identifier: Property.ShortText({
      displayName: 'Product Identifier',
      description:
        'Barcode/UPC, Amazon ASIN, product URL, model number, or product name.',
      required: true,
    }),
    startDate: Property.ShortText({
      displayName: 'Start Date',
      description: 'Start date in YYYY-MM-DD format (e.g. "2025-01-01").',
      required: true,
    }),
    endDate: Property.ShortText({
      displayName: 'End Date',
      description: 'End date in YYYY-MM-DD format (e.g. "2025-06-01").',
      required: true,
    }),
    retailer: Property.ShortText({
      displayName: 'Retailer',
      description:
        'Optional retailer domain to filter by (e.g. "amazon.com").',
      required: false,
    }),
  },
  sampleData: {
    success: true,
    data: [
      {
        id: 'offer_1',
        retailer: 'Amazon',
        price: 299.99,
        currency: 'USD',
        URL: 'https://amazon.com/dp/B09XS7JWHH',
        history: [
          {
            date: '2025-01-01',
            price: 349.99,
            availability: 'In Stock',
          },
          {
            date: '2025-03-15',
            price: 329.99,
            availability: 'In Stock',
          },
          {
            date: '2025-05-01',
            price: 299.99,
            availability: 'In Stock',
          },
        ],
      },
    ],
  },
  async run(context) {
    return await getPriceHistory({
      apiKey: context.auth,
      identifier: context.propsValue.identifier,
      startDate: context.propsValue.startDate,
      endDate: context.propsValue.endDate,
      retailer: context.propsValue.retailer,
    });
  },
});
