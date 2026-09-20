import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const getAmazonSellerAction = createAction({
  auth: neuralvergeAuth,
  name: 'get_amazon_seller',
  classification: 'READ',
  displayName: 'Get Amazon Seller',
  description: 'Get an Amazon seller profile: name, rating, rating count, feedback and business details. Cost: 5 points (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Get an Amazon seller profile by seller ID: name, rating, 365-day rating count, positive feedback share and business details. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    seller: Property.ShortText({
      displayName: 'Seller ID',
      description: 'Amazon seller ID, for example A2L77EE7U53NWQ.',
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
      endpoint: 'run-amazon-seller',
      body: {
        seller: propsValue.seller,
        domain: propsValue.domain,
      },
    });
  },
});
