import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { GooglePlaySearchConfig, SerpApiEngine } from '../types';
import { searchGooglePlayOutputSchema } from '../output-schemas';

export const searchGooglePlay = createAction({
  auth: serpApiAuth,
  name: 'search_google_play',
  displayName: 'Search Google Play',
  description: 'Search the Google Play store for apps, games, movies, or books.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches the Google Play store via SerpApi for a query within a chosen store section, returning results in `organic_results` (title, developer, rating, link). Use to discover Android apps, games, movies, or books. Set Store to "apps" (default), "games", "movies", or "books". For iOS apps use Search Apple App Store instead. Read-only and idempotent; requires the query and a SerpApi API key.',
    idempotent: true,
  },
  outputSchema: searchGooglePlayOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'What to search for, e.g. "puzzle games".',
      required: true,
    }),
    store: Property.ShortText({
      displayName: 'Store Section',
      description: 'Store section: "apps" (default), "games", "movies", or "books". Optional.',
      required: false,
    }),
    apps_category: Property.ShortText({
      displayName: 'Apps Category',
      description: 'Optional Google Play apps category filter, e.g. "GAME_PUZZLE".',
      required: false,
    }),
    next_page_token: Property.ShortText({
      displayName: 'Next Page Token',
      description: 'Pagination token from the `next_page_token` field of a previous response. Optional.',
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

      const searchConfig: GooglePlaySearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE_PLAY,
        q: propsValue.query,
        hl: propsValue.hl || undefined,
        gl: propsValue.gl || undefined,
      };

      if (propsValue.store) {
        searchConfig.store = propsValue.store;
      }

      if (propsValue.apps_category) {
        searchConfig.apps_category = propsValue.apps_category;
      }

      if (propsValue.next_page_token) {
        searchConfig.next_page_token = propsValue.next_page_token;
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
