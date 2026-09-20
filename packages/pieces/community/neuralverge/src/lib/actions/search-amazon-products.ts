import { createAction, Property } from '@activepieces/pieces-framework';
import { neuralvergeAuth } from '../auth';
import { neuralvergeClient } from '../common/client';

export const searchAmazonProductsAction = createAction({
  auth: neuralvergeAuth,
  name: 'search_amazon_products',
  classification: 'SEARCH',
  displayName: 'Search Amazon Products',
  description: 'Search Amazon products by keyword on any supported marketplace. Cost: 1 point per product (1 point = $0.001).',
  audience: 'both',
  aiMetadata: {
    description: 'Search Amazon product listings by keyword on a given marketplace. Billed per product returned. Results can differ between identical runs. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Keywords to search for, for example wireless mouse.',
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
      description: 'Maximum number of products to return (up to 250). Each product is billed.',
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
      endpoint: 'run-amazon-product-search',
      body: {
        query: propsValue.query,
        domain: propsValue.domain,
        max_items: propsValue.max_items,
        start_page: propsValue.start_page,
      },
    });
  },
});
