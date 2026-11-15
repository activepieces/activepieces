import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { COUNTRY_OPTIONS } from '../constants/countries';
import { LANGUAGE_OPTIONS } from '../constants/languages';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleNewsSearchConfig, SerpApiEngine } from '../types';
import { googleNewsSearchOutputSchema } from '../output-schemas';

export const googleNewsSearch = createAction({
  auth: serpApiAuth,
  name: 'google_news_search',
  classification: 'SEARCH',
  displayName: 'Google News Search',
  description: 'Search Google News for recent articles about a topic or brand.',
  audience: 'human',
  aiMetadata: { description: 'Searches Google News via SerpApi for recent articles matching a query. Use to monitor brand or topic mentions in the news, surface breaking coverage, or gather current headlines, scoped by language and country. Read-only and idempotent; requires the query and a SerpApi API key.', idempotent: true },
  outputSchema: googleNewsSearchOutputSchema,
  propertyGroups: [
    { key: 'search', display: 'section', label: 'Search', icon: 'text', props: ['cost_note', 'query'] },
    { key: 'location', display: 'section', label: 'Language & country', icon: 'location', props: ['hl', 'gl'] },
  ],
  props: {
    cost_note: Property.MarkDown({
      value: 'Every new search counts against your SerpApi plan. Repeating the same search within an hour is free if cached results are allowed.',
      variant: MarkdownVariant.INFO,
    }),

    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'What to search Google News for.',
      placeholder: 'electric cars',
      required: true,
    }),

    hl: Property.StaticDropdown({
      displayName: 'Language',
      description: 'Language of the results.',
      required: false,
      defaultValue: 'en',
      options: {
        options: LANGUAGE_OPTIONS,
      },
    }),

    gl: Property.StaticDropdown({
      displayName: 'Country',
      description: 'Country the results are for.',
      required: false,
      options: {
        options: COUNTRY_OPTIONS,
      },
    }),

    no_cache: Property.StaticDropdown({
      displayName: 'Cached Results',
      description: 'Cached results are free and up to an hour old.',
      required: false,
      defaultValue: 'false',
      advanced: true,
      options: {
        options: [
          { label: 'Allow cached results', value: 'false' },
          { label: 'Always run a new search', value: 'true' },
        ],
      },
    }),

    async: Property.StaticDropdown({
      displayName: 'Search Mode',
      description: 'The ID-only option gives no results and needs cached results allowed.',
      required: false,
      defaultValue: 'false',
      advanced: true,
      options: {
        options: [
          { label: 'Wait for results', value: 'false' },
          { label: 'Return the search ID only', value: 'true' },
        ],
      },
    }),

    output: Property.StaticDropdown({
      displayName: 'Response Format',
      description: 'JSON gives structured data; HTML is the raw results page.',
      required: false,
      defaultValue: 'json',
      advanced: true,
      options: {
        options: [
          { label: 'JSON', value: 'json' },
          { label: 'Raw HTML', value: 'html' },
        ],
      },
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

      const searchConfig: GoogleNewsSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE_NEWS,
        q: propsValue.query,
        hl: propsValue.hl,
        gl: propsValue.gl,
      };

      // Add optional parameters
      if (propsValue.gl) {
        (searchConfig as any).gl = propsValue.gl;
      }

      if (propsValue.no_cache) {
        (searchConfig as any).no_cache = propsValue.no_cache;
      }

      if (propsValue.async) {
        (searchConfig as any).async = propsValue.async;
      }

      if (propsValue.output) {
        (searchConfig as any).output = propsValue.output;
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
