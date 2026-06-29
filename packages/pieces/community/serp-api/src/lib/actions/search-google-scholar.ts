import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleScholarSearchConfig, SerpApiEngine } from '../types';

export const searchGoogleScholar = createAction({
  auth: serpApiAuth,
  name: 'search_google_scholar',
  displayName: 'Search Google Scholar',
  description: 'Search academic papers and citations on Google Scholar for a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Google Scholar via SerpApi for academic papers and citations matching a query, returning results in `organic_results` (title, authors, publication, year, cited-by count, PDF/resource links). Use to research literature, find citations, or gather academic sources. Use `as_ylo`/`as_yhi` to restrict by publication year. Read-only and idempotent; requires the query and a SerpApi API key.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The academic search query, e.g. "transformer neural networks".',
      required: true,
    }),
    num_results: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of results to return (1-20). Optional.',
      required: false,
    }),
    start: Property.Number({
      displayName: 'Start Position',
      description: 'Zero-based offset for pagination (multiples of 10). Optional.',
      required: false,
    }),
    as_ylo: Property.Number({
      displayName: 'From Year',
      description: 'Lower bound of the publication year range, e.g. 2018. Optional.',
      required: false,
    }),
    as_yhi: Property.Number({
      displayName: 'To Year',
      description: 'Upper bound of the publication year range, e.g. 2024. Optional.',
      required: false,
    }),
    hl: Property.ShortText({
      displayName: 'Language (hl)',
      description: 'Two-character lowercase ISO 639-1 language code, e.g. "en", "es". Optional.',
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

      const searchConfig: GoogleScholarSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE_SCHOLAR,
        q: propsValue.query,
        hl: propsValue.hl,
        num: propsValue.num_results,
        start: propsValue.start,
        as_ylo: propsValue.as_ylo,
        as_yhi: propsValue.as_yhi,
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
