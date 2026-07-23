import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleJobsSearchConfig, SerpApiEngine } from '../types';
import { searchGoogleJobsOutputSchema } from '../output-schemas';

export const searchGoogleJobs = createAction({
  auth: serpApiAuth,
  name: 'search_google_jobs',
  displayName: 'Search Google Jobs',
  description: 'Find job listings on Google Jobs for a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Google Jobs via SerpApi for job listings matching a query, returning results in `jobs_results` (title, company, location, posted date, schedule, apply links). Use to find open positions for a role. Narrow with a free-text Location, and set Listing Type to "1" for work-from-home roles. Paginate with the next page token from a prior response. Read-only and idempotent; requires the query and a SerpApi API key.',
    idempotent: true,
  },
  outputSchema: searchGoogleJobsOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The job role to search for, e.g. "software engineer".',
      required: true,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description: 'Free-text location, e.g. "New York, NY". SerpApi resolves it server-side. Optional.',
      required: false,
    }),
    ltype: Property.ShortText({
      displayName: 'Listing Type',
      description: 'Set to "1" to return only work-from-home jobs. Optional.',
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

      const searchConfig: GoogleJobsSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE_JOBS,
        q: propsValue.query,
        hl: propsValue.hl || undefined,
        gl: propsValue.gl || undefined,
      };

      if (propsValue.location) {
        searchConfig.location = propsValue.location;
      }

      if (propsValue.ltype) {
        searchConfig.ltype = propsValue.ltype;
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
