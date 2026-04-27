import { createAction, Property } from '@activepieces/pieces-framework';

import { shopsavvyAuth } from '../common/auth';
import { getProductDetails } from '../common/client';

export const getProductDetailsAction = createAction({
  auth: shopsavvyAuth,
  name: 'get-product-details',
  displayName: 'Get Product Details',
  description:
    'Look up detailed product information by barcode, ASIN, URL, model number, or product name.',
  props: {
    identifier: Property.ShortText({
      displayName: 'Product Identifier',
      description:
        'Barcode/UPC, Amazon ASIN, product URL, model number, or product name.',
      required: true,
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
        description:
          'Industry-leading noise canceling with Auto NC Optimizer',
        images: ['https://m.media-amazon.com/images/I/51aXvjzcukL.jpg'],
        rating: { value: 4.6, count: 12345 },
      },
    ],
  },
  async run(context) {
    return await getProductDetails({
      apiKey: context.auth,
      identifier: context.propsValue.identifier,
    });
  },
});
