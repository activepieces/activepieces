import { createAction, Property } from '@activepieces/pieces-framework';

import { shopsavvyAuth } from '../common/auth';
import { searchProducts } from '../common/client';

export const searchProductsAction = createAction({
  auth: shopsavvyAuth,
  name: 'search-products',
  displayName: 'Search Products',
  description:
    'Search for products by keyword across millions of products.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description:
        'Product name, keyword, or description to search for (e.g. "sony headphones", "iphone 15 pro").',
      required: true,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return (1-100).',
      required: false,
      defaultValue: 10,
    }),
  },
  sampleData: {
    success: true,
    data: [
      {
        title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
        shopsavvy: 'sp_abc123',
        brand: 'Sony',
        category: 'Headphones',
        barcode: '027242923782',
        amazon: 'B09XS7JWHH',
        model: 'WH1000XM5/B',
      },
    ],
    pagination: {
      total: 42,
      limit: 10,
      offset: 0,
      returned: 1,
    },
  },
  async run(context) {
    return await searchProducts({
      apiKey: context.auth,
      query: context.propsValue.query,
      limit: context.propsValue.limit,
    });
  },
});
