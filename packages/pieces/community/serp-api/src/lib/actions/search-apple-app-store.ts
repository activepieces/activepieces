import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { AppleAppStoreSearchConfig, SerpApiEngine } from '../types';
import { searchAppleAppStoreOutputSchema } from '../output-schemas';

export const searchAppleAppStore = createAction({
  auth: serpApiAuth,
  name: 'search_apple_app_store',
  displayName: 'Search Apple App Store',
  description: 'Search the iOS Apple App Store for apps matching a term.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches the Apple App Store via SerpApi for iOS apps matching a term, returning results in `organic_results` (app name, developer, rating, price, link). Use to discover iOS apps or look up an app by name. For Android apps use Search Google Play instead. Read-only and idempotent; requires the search term and a SerpApi API key.',
    idempotent: true,
  },
  outputSchema: searchAppleAppStoreOutputSchema,
  props: {
    term: Property.ShortText({
      displayName: 'Search Term',
      description: 'The app or keyword to search for, e.g. "meditation".',
      required: true,
    }),
    num_results: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of results to return. Optional.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Two-letter App Store country/storefront code, e.g. "us", "gb". Optional.',
      required: false,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description: 'Language code for results, e.g. "en-us". Optional.',
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

      const searchConfig: AppleAppStoreSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.APPLE_APP_STORE,
        term: propsValue.term,
        num: propsValue.num_results,
      };

      if (propsValue.country) {
        searchConfig.country = propsValue.country;
      }

      if (propsValue.lang) {
        searchConfig.lang = propsValue.lang;
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
        search_term: propsValue.term,
      };
    }
  },
});
