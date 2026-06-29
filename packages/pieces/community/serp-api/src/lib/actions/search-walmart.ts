import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { SerpApiEngine, WalmartSearchConfig } from '../types';

export const searchWalmart = createAction({
  auth: serpApiAuth,
  name: 'search_walmart',
  displayName: 'Search Walmart',
  description: 'Find products on Walmart for a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Walmart via SerpApi for products matching a query, returning results in `organic_results` (title, price, rating, seller, product link). Use to look up Walmart product pricing and availability. Filter by price range and minimum rating, sort, and paginate by page. Read-only and idempotent; requires the query and a SerpApi API key.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The product to search for, e.g. "office chair".',
      required: true,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for pagination (1-based). Optional.',
      required: false,
    }),
    sort: Property.ShortText({
      displayName: 'Sort By',
      description: 'Sort order, e.g. "price_low", "price_high", "best_seller", "rating_high". Optional.',
      required: false,
    }),
    min_price: Property.Number({
      displayName: 'Minimum Price',
      description: 'Lowest product price to include. Optional.',
      required: false,
    }),
    max_price: Property.Number({
      displayName: 'Maximum Price',
      description: 'Highest product price to include. Optional.',
      required: false,
    }),
    min_rating: Property.Number({
      displayName: 'Minimum Rating',
      description: 'Lowest average rating to include (e.g. 4). Optional.',
      required: false,
    }),
    store_id: Property.ShortText({
      displayName: 'Store ID',
      description: 'Walmart store id to scope availability. Optional.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    try {
      const client = new SerpApiClient({
        defaultTimeout: 30000,
        defaultRetries: 3,
        defaultRetryDelay: 1000,
        enableLogging: false,
      });

      const searchConfig: WalmartSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.WALMART,
        query: propsValue.query,
        page: propsValue.page,
        min_price: propsValue.min_price,
        max_price: propsValue.max_price,
        min_rating: propsValue.min_rating,
      };

      if (propsValue.sort) {
        searchConfig.sort = propsValue.sort;
      }

      if (propsValue.store_id) {
        searchConfig.store_id = propsValue.store_id;
      }

      const response = await client.executeSearch(searchConfig);

      return {
        success: true,
        ...response,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      return {
        success: false,
        error: errorMessage,
        error_type: error instanceof Error ? error.constructor.name : 'UnknownError',
        timestamp: new Date().toISOString(),
        search_query: propsValue.query,
      };
    }
  },
});
