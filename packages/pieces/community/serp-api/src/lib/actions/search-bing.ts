import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { BingSearchConfig, SerpApiEngine } from '../types';
import { searchBingOutputSchema } from '../output-schemas';

export const searchBing = createAction({
  auth: serpApiAuth,
  name: 'search_bing',
  displayName: 'Search Bing',
  description: 'Run a Bing web search for a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Runs a Bing web search via SerpApi and returns organic web results (in `organic_results`) for a query. Use as an alternative web engine to cross-check or supplement Google web results. Paginate with Count (results per page) and First (offset of the first result). Read-only and idempotent; requires the query and a SerpApi API key.',
    idempotent: true,
  },
  outputSchema: searchBingOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The web search query to execute, e.g. "climate change report".',
      required: true,
    }),
    cc: Property.ShortText({
      displayName: 'Country Code (cc)',
      description: 'Two-letter country code to scope results, e.g. "us", "gb". Optional.',
      required: false,
    }),
    mkt: Property.ShortText({
      displayName: 'Market (mkt)',
      description: 'Market locale in language-country form, e.g. "en-US", "de-DE". Optional.',
      required: false,
    }),
    count: Property.Number({
      displayName: 'Count',
      description: 'Number of results to return per page. Optional.',
      required: false,
    }),
    first: Property.Number({
      displayName: 'First Result Offset',
      description: 'One-based index of the first result to return, for pagination. Optional.',
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

      const searchConfig: BingSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.BING,
        q: propsValue.query,
        count: propsValue.count,
        first: propsValue.first,
      };

      if (propsValue.cc) {
        searchConfig.cc = propsValue.cc;
      }

      if (propsValue.mkt) {
        searchConfig.mkt = propsValue.mkt;
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
