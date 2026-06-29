import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleShoppingSearchConfig, SerpApiEngine } from '../types';

export const searchGoogleShopping = createAction({
  auth: serpApiAuth,
  name: 'search_google_shopping',
  displayName: 'Search Google Shopping',
  description: 'Find products on Google Shopping for a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Google Shopping via SerpApi for products matching a query, returning results in `shopping_results` (title, price, merchant/source, rating, product_id, link). Use to compare product prices across merchants or research products. Paginate with Start (preferred on this engine). Read-only and idempotent; requires the query and a SerpApi API key.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The product to search for, e.g. "wireless headphones".',
      required: true,
    }),
    start: Property.Number({
      displayName: 'Start Position',
      description: 'Zero-based offset for pagination (multiples of 60). Optional.',
      required: false,
    }),
    hl: Property.ShortText({
      displayName: 'Language (hl)',
      description: 'Two-character lowercase ISO 639-1 language code, e.g. "en", "es". Optional.',
      required: false,
    }),
    gl: Property.ShortText({
      displayName: 'Country (gl)',
      description: 'Two-character lowercase ISO 3166-1 country code, e.g. "us", "gb". Optional.',
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

      const searchConfig: GoogleShoppingSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE_SHOPPING,
        q: propsValue.query,
        hl: propsValue.hl || undefined,
        gl: propsValue.gl || undefined,
        start: propsValue.start,
      };

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
