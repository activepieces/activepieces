import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const listAmazonSellerProductsAction = createAction({
  auth: neuralvergeAuth,
  name: 'list_amazon_seller_products',
  classification: 'SEARCH',
  displayName: 'List Amazon Seller Products',
  description: 'List the storefront products of an Amazon seller. Cost: 1 point per product (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'List products from an Amazon seller storefront by seller ID. Billed per product returned. Read-only and safe to retry.',
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
    max_items: Property.Number({
      displayName: 'Max Items',
      description: 'Maximum number of products to return. Each product is billed.',
      required: false,
      defaultValue: 10,
    }),
    start_page: Property.Number({
      displayName: 'Start Page',
      description: 'Result page to start from.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    return neuralvergeClient.post({
      apiKey: auth.secret_text,
      endpoint: 'run-amazon-seller-products',
      body: {
        seller: propsValue.seller,
        domain: propsValue.domain,
        max_items: propsValue.max_items,
        start_page: propsValue.start_page,
      },
    });
  },
});
