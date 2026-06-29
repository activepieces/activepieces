import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { DuckDuckGoSearchConfig, SerpApiEngine } from '../types';

export const searchDuckduckgo = createAction({
  auth: serpApiAuth,
  name: 'search_duckduckgo',
  displayName: 'Search DuckDuckGo',
  description: 'Run a DuckDuckGo web search for a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Runs a DuckDuckGo web search via SerpApi and returns organic web results (in `organic_results`) for a query. Use as a privacy-oriented alternative web engine to cross-check or supplement Google and Bing web results. Scope results to a region with the Region code. Read-only and idempotent; requires the query and a SerpApi API key.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The web search query to execute, e.g. "open source databases".',
      required: true,
    }),
    kl: Property.ShortText({
      displayName: 'Region (kl)',
      description: 'Region locale in country-language form, e.g. "us-en", "uk-en", "de-de". Optional.',
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

      const searchConfig: DuckDuckGoSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.DUCKDUCKGO,
        q: propsValue.query,
      };

      if (propsValue.kl) {
        searchConfig.kl = propsValue.kl;
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
