import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const getAmazonProductAction = createAction({
  auth: neuralvergeAuth,
  name: 'get_amazon_product',
  classification: 'READ',
  displayName: 'Get Amazon Product',
  description: 'Get Amazon product details by ASIN: title, brand, price, rating, images, features and specs. Cost: 5 points (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Get full Amazon product details for one ASIN: title, brand, price, rating, images, features, specs and variations. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    asin: Property.ShortText({
      displayName: 'ASIN',
      description: 'Amazon product ASIN, for example B004YAVF8I.',
      required: true,
    }),
    domain: Property.ShortText({
      displayName: 'Marketplace Domain',
      description: 'Amazon marketplace domain, for example amazon.com, amazon.co.uk or amazon.de.',
      required: false,
      defaultValue: "amazon.com",
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-amazon-product',
      body: {
        asin: propsValue.asin,
        domain: propsValue.domain,
      },
    });
  },
});
