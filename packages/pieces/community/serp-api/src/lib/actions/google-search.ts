import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { COUNTRY_OPTIONS } from '../constants/countries';
import { GOOGLE_DOMAIN_OPTIONS } from '../constants/google-domains';
import { LANGUAGE_OPTIONS } from '../constants/languages';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleSearchConfig, SerpApiEngine } from '../types';
import { googleSearchOutputSchema } from '../output-schemas';

export const googleSearch = createAction({
  auth: serpApiAuth,
  name: 'google_search',
  classification: 'SEARCH',
  displayName: 'Google Search',
  description: 'Search Google and get the results as seen from a place and language.',
  audience: 'human',
  aiMetadata: { description: 'Runs a Google web search via SerpApi and returns organic results for a query. Use to look up current web information, check rankings, or research a topic with controls for location, language, country, device, and pagination. Read-only and idempotent; requires the search query and a SerpApi API key.', idempotent: true },
  outputSchema: googleSearchOutputSchema,
  propertyGroups: [
    { key: 'search', display: 'section', label: 'Search', icon: 'text', props: ['cost_note', 'query'] },
    {
      key: 'location',
      display: 'section',
      label: 'Location & language',
      icon: 'location',
      props: ['location_search', 'location', 'hl', 'gl', 'google_domain'],
    },
    {
      key: 'results',
      display: 'section',
      label: 'Results',
      icon: 'filter',
      props: ['num_results', 'start', 'safe', 'filter', 'device'],
    },
  ],
  props: {
    cost_note: Property.MarkDown({
      value: 'Every new search counts against your SerpApi plan. Repeating the same search within an hour is free if cached results are allowed.',
      variant: MarkdownVariant.INFO,
    }),

    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'What to search for on Google.',
      placeholder: 'best running shoes',
      required: true,
    }),

    location_search: Property.ShortText({
      displayName: 'Find Location',
      description: 'Type a city or region, then pick the match in Location.',
      placeholder: 'Austin',
      required: false,
    }),

    location: Property.Dropdown({
      auth: serpApiAuth,
      displayName: 'Location',
      description: 'Results as seen from this place.',
      required: false,
      refreshers: ['location_search'],
      options: async ({ auth, location_search }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Connect your SerpApi account first',
          };
        }

        if (typeof location_search !== 'string' || location_search.trim().length === 0) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Type a place in Find Location first',
          };
        }

        try {
          const response = await httpClient.sendRequest<SerpApiLocation[]>({
            method: HttpMethod.GET,
            url: 'https://serpapi.com/locations.json',
            queryParams: {
              q: location_search,
              limit: '10',
            },
          });

          if (Array.isArray(response.body) && response.body.length > 0) {
            return {
              disabled: false,
              options: response.body.map((location) => ({
                label: locationLabel(location),
                value: location.canonical_name || location.name,
              })),
            };
          }

          return {
            disabled: false,
            options: [],
            placeholder: 'No places match. Try another name.',
          };
        } catch {
          return {
            disabled: false,
            options: [],
            placeholder: 'Could not load places. Try another name.',
          };
        }
      },
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

    google_domain: Property.StaticDropdown({
      displayName: 'Google Domain',
      description: 'Which Google site to search, such as google.co.uk.',
      required: false,
      defaultValue: 'google.com',
      options: {
        options: GOOGLE_DOMAIN_OPTIONS,
      },
    }),

    num_results: Property.Number({
      displayName: 'Number of Results',
      description: 'How many results to return, from 1 to 100.',
      required: false,
      defaultValue: 10,
      display: 'stepper',
      min: 1,
      max: 100,
      step: 1,
    }),

    start: Property.Number({
      displayName: 'Results to Skip',
      description: 'Skip this many results to get later pages.',
      required: false,
      defaultValue: 0,
      display: 'stepper',
      min: 0,
      max: 990,
      step: 1,
    }),

    safe: Property.StaticDropdown({
      displayName: 'Safe Search',
      description: 'Hide explicit results.',
      required: false,
      defaultValue: 'active',
      width: 'half',
      options: {
        options: [
          { label: 'On', value: 'active' },
          { label: 'Off', value: 'off' },
        ],
      },
    }),

    filter: Property.StaticDropdown({
      displayName: 'Similar Results',
      description: 'Hide results Google treats as near duplicates.',
      required: false,
      defaultValue: '0',
      width: 'half',
      options: {
        options: [
          { label: 'Show', value: '0' },
          { label: 'Hide', value: '1' },
        ],
      },
    }),

    device: Property.StaticDropdown({
      displayName: 'Device',
      description: 'Get the results a desktop, phone or tablet would see.',
      required: false,
      defaultValue: 'desktop',
      options: {
        options: [
          { label: 'Desktop', value: 'desktop' },
          { label: 'Mobile', value: 'mobile' },
          { label: 'Tablet', value: 'tablet' },
        ],
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
  },

  async run({ auth, propsValue }) {
    try {
      // Create SerpApi client with optimal settings
      const client = new SerpApiClient({
        defaultTimeout: 30000,
        defaultRetries: 3,
        defaultRetryDelay: 1000,
        enableLogging: false,
      });

      // Build search configuration
      const searchConfig: GoogleSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE,
        q: propsValue.query,
        hl: propsValue.hl,
        num: propsValue.num_results,
        start: propsValue.start,
        safe: propsValue.safe as 'active' | 'off',
        device: propsValue.device as 'desktop' | 'mobile' | 'tablet',
        filter: propsValue.filter as '0' | '1',
      };

      // Add optional location if provided
      if (propsValue.location) {
        (searchConfig as any).location = propsValue.location;
      }

      // Add optional google_domain if provided
      if (propsValue.google_domain) {
        (searchConfig as any).google_domain = propsValue.google_domain;
      }

      // Add optional gl (country) if provided
      if (propsValue.gl) {
        (searchConfig as any).gl = propsValue.gl;
      }

      // Add optional no_cache and async if provided
      if (propsValue.no_cache) {
        (searchConfig as any).no_cache = propsValue.no_cache;
      }

      if (propsValue.async) {
        (searchConfig as any).async = propsValue.async;
      }

      // Execute search with comprehensive error handling
      const response = await client.executeSearch(searchConfig, {
        timeout: 30000,
        retries: 3,
        retryDelay: 1000,
      });

      // Return structured response with metadata
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

function locationLabel(location: SerpApiLocation): string {
  const place = location.canonical_name ? location.canonical_name.split(',').join(', ') : location.name;
  return location.target_type ? `${place} (${location.target_type})` : place;
}

type SerpApiLocation = {
  name: string;
  canonical_name?: string;
  target_type?: string;
};
