import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleTrendsSearchConfig, SerpApiEngine } from '../types';
import { searchGoogleTrendsAiOutputSchema } from '../output-schemas';

export const searchGoogleTrendsAi = createAction({
  auth: serpApiAuth,
  name: 'search_google_trends_ai',
  displayName: 'Google Trends Search (Agent)',
  description: 'Query Google Trends for interest in a keyword over time and across regions.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Queries Google Trends via SerpApi for search interest in a keyword. Use to gauge a topic\'s popularity trajectory, compare geographic interest, or find related/rising queries. Choose the data type: "TIMESERIES" (interest over time), "GEO_MAP" (interest by region), "RELATED_TOPICS", or "RELATED_QUERIES" — the response key matches the chosen data type (e.g. `interest_over_time`). Read-only and idempotent; requires the query and a SerpApi API key.',
    idempotent: true,
  },
  outputSchema: searchGoogleTrendsAiOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The keyword or topic to analyze trends for, e.g. "artificial intelligence".',
      required: true,
    }),
    data_type: Property.ShortText({
      displayName: 'Data Type',
      description:
        'Type of trends data: one of "TIMESERIES" (interest over time, default), "GEO_MAP" (interest by region), "RELATED_TOPICS", or "RELATED_QUERIES". Optional.',
      required: false,
    }),
    geo: Property.ShortText({
      displayName: 'Geographic Location',
      description:
        'Uppercase two-letter region code to scope the trend to, e.g. "US", "GB", "JP". Leave empty for worldwide. Optional.',
      required: false,
    }),
    date: Property.ShortText({
      displayName: 'Time Period',
      description:
        'Trends date range token, e.g. "today 12-m" (past 12 months), "today 5-y", "now 7-d", or "all". Optional.',
      required: false,
    }),
    category: Property.Number({
      displayName: 'Category',
      description: 'Google Trends category id (0 for all categories). Optional.',
      required: false,
    }),
    gprop: Property.ShortText({
      displayName: 'Property Filter',
      description:
        'Google property to filter by: empty for web, or "images", "news", "froogle" (shopping), "youtube". Optional.',
      required: false,
    }),
    hl: Property.ShortText({
      displayName: 'Language (hl)',
      description: 'Two-character lowercase ISO 639-1 language code, e.g. "en", "es", "fr". Optional.',
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

      const searchConfig: GoogleTrendsSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE_TRENDS,
        q: propsValue.query,
        hl: propsValue.hl || undefined,
        data_type: propsValue.data_type
          ? (propsValue.data_type as
              | 'TIMESERIES'
              | 'GEO_MAP'
              | 'RELATED_TOPICS'
              | 'RELATED_QUERIES')
          : undefined,
        geo: propsValue.geo || undefined,
        date: propsValue.date || undefined,
        cat: propsValue.category || undefined,
      };

      if (propsValue.gprop) {
        searchConfig.gprop = propsValue.gprop;
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
