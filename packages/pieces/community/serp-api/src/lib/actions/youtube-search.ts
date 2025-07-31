/**
 * @fileoverview YouTube Search action for SerpApi
 * Provides comprehensive YouTube search functionality with quality and duration filters
 */

import { createAction, Property } from '@activepieces/pieces-framework';
import { serpApiAuth } from '../../index';
import { COUNTRY_OPTIONS } from '../constants/countries';
import { LANGUAGE_OPTIONS } from '../constants/languages';
import { SerpApiClient } from '../services/serp-api-client';
import { SerpApiEngine, YouTubeSearchConfig } from '../types';

export const youtubeSearch = createAction({
  auth: serpApiAuth,
  name: 'youtube_search',
  displayName: 'YouTube Search',
  description: 'Retrieve top video content results from YouTube for specific keywords or topics with advanced filtering.',
  props: {
    query: Property.ShortText({
      displayName: 'Search Query',
      description: 'YouTube search query',
      required: true,
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

    output: Property.StaticDropdown({
      displayName: 'Output',
      description: 'Output format for results',
      required: false,
      defaultValue: 'json',
      options: {
        options: [
          { label: 'JSON (Structured)', value: 'json' },
          { label: 'HTML (Raw)', value: 'html' },
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

      const searchConfig: YouTubeSearchConfig = {
        api_key: auth,
        engine: SerpApiEngine.YOUTUBE,
        search_query: propsValue.query,
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
        ...response
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
