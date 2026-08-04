import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { SerpApiEngine, YelpSearchConfig } from '../types';
import { searchYelpOutputSchema } from '../output-schemas';

export const searchYelp = createAction({
  auth: serpApiAuth,
  name: 'search_yelp',
  displayName: 'Search Yelp',
  description: 'Find businesses and reviews on Yelp for a category and location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Yelp via SerpApi for businesses matching a description in a location, returning results in `organic_results` (name, rating, review count, category, price level, link). Use to find rated local businesses or read review summaries. Both what to search (Find Description) and where (Find Location) are required. Read-only and idempotent; requires those two fields and a SerpApi API key.',
    idempotent: true,
  },
  outputSchema: searchYelpOutputSchema,
  props: {
    find_desc: Property.ShortText({
      displayName: 'Find Description',
      description: 'What to search for, e.g. "italian restaurants" or "auto repair".',
      required: true,
    }),
    find_loc: Property.ShortText({
      displayName: 'Find Location',
      description: 'Where to search, e.g. "San Francisco, CA".',
      required: true,
    }),
    sortby: Property.ShortText({
      displayName: 'Sort By',
      description: 'Sort order: "recommended" (default), "rating", or "review_count". Optional.',
      required: false,
    }),
    attrs: Property.ShortText({
      displayName: 'Attributes',
      description: 'Attribute filters, e.g. "RestaurantsPriceRange2.2". Optional.',
      required: false,
    }),
    start: Property.Number({
      displayName: 'Start Position',
      description: 'Zero-based offset for pagination (multiples of 10). Optional.',
      required: false,
    }),
    yelp_domain: Property.ShortText({
      displayName: 'Yelp Domain',
      description: 'Yelp domain to use, e.g. "yelp.com" (default). Optional.',
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

      const searchConfig: YelpSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.YELP,
        find_desc: propsValue.find_desc,
        find_loc: propsValue.find_loc,
        start: propsValue.start,
      };

      if (propsValue.sortby) {
        searchConfig.sortby = propsValue.sortby;
      }

      if (propsValue.attrs) {
        searchConfig.attrs = propsValue.attrs;
      }

      if (propsValue.yelp_domain) {
        searchConfig.yelp_domain = propsValue.yelp_domain;
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
        find_desc: propsValue.find_desc,
        find_loc: propsValue.find_loc,
      };
    }
  },
});
