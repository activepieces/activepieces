import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../../index';
import { COUNTRY_OPTIONS } from '../constants/countries';
import { GOOGLE_DOMAIN_OPTIONS } from '../constants/google-domains';
import { LANGUAGE_OPTIONS } from '../constants/languages';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleSearchConfig, SerpApiEngine } from '../types';

export const googleSearch = createAction({
  auth: serpApiAuth,
  name: 'google_search',
  displayName: 'Google Search',
  description: 'Retrieves organic search results for specific keywords with advanced filtering options for SEO monitoring and competitor analysis.',

  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'Search query to execute',
      required: true,
    }),

    location_search: Property.ShortText({
      displayName: 'Location Search',
      description: 'Type location name to search',
      required: false,
    }),

    location: Property.Dropdown({
      displayName: 'Location',
      description: 'Geographic location for results',
      required: false,
      refreshers: ['location_search'],
      options: async ({ auth, location_search }) => {
        if (!auth || !location_search) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Type a location to search...',
          };
        }

        try {
          const response = await httpClient.sendRequest({
            method: HttpMethod.GET,
            url: 'https://serpapi.com/locations.json',
            queryParams: {
              q: location_search as string,
              limit: '10',
            },
          });

          if (response.body && Array.isArray(response.body)) {
            return {
              disabled: false,
              options: response.body.map((location: any) => ({
                label: `${location.name}${location.country ? `, ${location.country}` : ''}`,
                value: location.canonical_name || location.name,
              })),
            };
          }

          return {
            disabled: false,
            options: [],
            placeholder: 'No locations found',
          };
        } catch (error) {
          console.error('Error fetching locations:', error);
          return {
            disabled: false,
            options: [],
            placeholder: 'Error searching locations. Please check your API key.',
          };
        }
      },
    }),

    hl: Property.StaticDropdown({
      displayName: 'Host Language (hl)',
      description: 'Language for search results',
      required: false,
      defaultValue: 'en',
      options: {
        options: LANGUAGE_OPTIONS,
      },
    }),

    google_domain: Property.StaticDropdown({
      displayName: 'Google Domain',
      description: 'Google domain to use',
      required: false,
      defaultValue: 'google.com',
      options: {
        options: GOOGLE_DOMAIN_OPTIONS,
      },
    }),

    gl: Property.StaticDropdown({
      displayName: 'Country (gl)',
      description: 'Country for search results',
      required: false,
      options: {
        options: COUNTRY_OPTIONS,
      },
    }),

    no_cache: Property.StaticDropdown({
      displayName: 'No Cache',
      description: 'Force fresh results',
      required: false,
      defaultValue: 'false',
      options: {
        options: [
          { label: 'false (Allow cache)', value: 'false' },
          { label: 'true (Force fresh results)', value: 'true' },
        ],
      },
    }),

    async: Property.StaticDropdown({
      displayName: 'Async',
      description: 'Submit search asynchronously',
      required: false,
      defaultValue: 'false',
      options: {
        options: [
          { label: 'false (Synchronous)', value: 'false' },
          { label: 'true (Asynchronous)', value: 'true' },
        ],
      },
    }),

    num_results: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of results to return (1-100)',
      required: false,
      defaultValue: 10,
    }),

    start: Property.Number({
      displayName: 'Start Position',
      description: 'Starting position for pagination (0-990)',
      required: false,
      defaultValue: 0,
    }),

    safe: Property.StaticDropdown({
      displayName: 'Safe Search',
      description: 'Safe search filtering level',
      required: false,
      defaultValue: 'active',
      options: {
        options: [
          { label: 'Active (Enabled)', value: 'active' },
          { label: 'Off (Disabled)', value: 'off' },
        ],
      },
    }),

    device: Property.StaticDropdown({
      displayName: 'Device Type',
      description: 'Device type for search simulation',
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

    filter: Property.StaticDropdown({
      displayName: 'Result Filter',
      description: 'Filter duplicate results',
      required: false,
      defaultValue: '0',
      options: {
        options: [
          { label: 'Show similar results', value: '0' },
          { label: 'Hide similar results', value: '1' },
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
        api_key: auth,
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
