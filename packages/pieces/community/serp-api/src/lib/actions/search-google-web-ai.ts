import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleSearchConfig, SerpApiEngine } from '../types';

export const searchGoogleWebAi = createAction({
  auth: serpApiAuth,
  name: 'search_google_web_ai',
  displayName: 'Google Search (Agent)',
  description: 'Run a Google web search and return organic results for a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Runs a Google web search via SerpApi and returns organic web results (in `organic_results`) for a query. Use this for general web lookups, current information, rankings, or topic research. For news pick Search Google News, for videos Search YouTube, for products Search Google Shopping. Read-only and idempotent; requires the query and a SerpApi API key.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The web search query to execute, e.g. "best electric cars 2024".',
      required: true,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      description:
        'Free-text geographic location to originate the search from, e.g. "Austin, Texas, United States". SerpApi resolves it server-side. Optional.',
      required: false,
    }),
    hl: Property.ShortText({
      displayName: 'Language (hl)',
      description: 'Two-character lowercase ISO 639-1 language code, e.g. "en", "es", "fr". Optional.',
      required: false,
    }),
    gl: Property.ShortText({
      displayName: 'Country (gl)',
      description: 'Two-character lowercase ISO 3166-1 country code, e.g. "us", "gb", "de". Optional.',
      required: false,
    }),
    device: Property.ShortText({
      displayName: 'Device',
      description: 'Device to simulate: one of "desktop", "mobile", or "tablet". Optional.',
      required: false,
    }),
    safe: Property.ShortText({
      displayName: 'Safe Search',
      description: 'Safe-search level: "active" or "off". Optional.',
      required: false,
    }),
    num_results: Property.Number({
      displayName: 'Number of Results',
      description: 'Number of results to return (1-100). Optional.',
      required: false,
    }),
    start: Property.Number({
      displayName: 'Start Position',
      description: 'Zero-based offset for pagination (0-990). Optional.',
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

      const searchConfig: GoogleSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.GOOGLE,
        q: propsValue.query,
        hl: propsValue.hl || undefined,
        gl: propsValue.gl || undefined,
        num: propsValue.num_results,
        start: propsValue.start,
        safe: propsValue.safe ? (propsValue.safe as 'active' | 'off') : undefined,
        device: propsValue.device ? (propsValue.device as 'desktop' | 'mobile' | 'tablet') : undefined,
      };

      if (propsValue.location) {
        searchConfig.location = propsValue.location;
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
