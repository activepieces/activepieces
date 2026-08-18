import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { GoogleNewsSearchConfig, SerpApiEngine } from '../types';
import { searchGoogleNewsAiOutputSchema } from '../output-schemas';

export const searchGoogleNewsAi = createAction({
  auth: serpApiAuth,
  name: 'search_google_news_ai',
  displayName: 'Google News Search (Agent)',
  description: 'Search Google News for recent articles matching a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Search Google News for recent news articles matching a query. Use to get the latest news headlines about a company, brand, person, or topic, monitor press and media mentions, or track breaking news coverage. For general web results pick Search Google instead.',
    idempotent: true,
  },
  outputSchema: searchGoogleNewsAiOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The news search query, e.g. "renewable energy policy".',
      required: true,
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
        hl: propsValue.hl || undefined,
        gl: propsValue.gl || undefined,
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
