import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../auth';
import { SerpApiClient } from '../services/serp-api-client';
import { SerpApiEngine, YouTubeSearchConfig } from '../types';

export const searchYoutubeAi = createAction({
  auth: serpApiAuth,
  name: 'search_youtube_ai',
  displayName: 'YouTube Search (Agent)',
  description: 'Search YouTube for videos matching a query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches YouTube via SerpApi for videos matching a query and returns them in `video_results`. Use to find video content on a topic, discover channels, or research what is being published. For news pick Search Google News, for general web Search Google. Read-only and idempotent; requires the search query and a SerpApi API key.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'The YouTube search query, e.g. "how to bake sourdough".',
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

      const searchConfig: YouTubeSearchConfig = {
        api_key: auth.secret_text,
        engine: SerpApiEngine.YOUTUBE,
        search_query: propsValue.query,
        hl: propsValue.hl,
        gl: propsValue.gl,
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
