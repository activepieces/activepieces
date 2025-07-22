import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { googleNewsSearch } from './lib/actions/google-news-search';
import { googleSearch } from './lib/actions/google-search';
import { googleTrendsSearch } from './lib/actions/google-trends-search';
import { youtubeSearch } from './lib/actions/youtube-search';
import { SerpApiClient } from './lib/services/serp-api-client';
import { SerpApiValidator } from './lib/utils/validators';

export const serpApiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `You can obtain your API key from [Dashboard](https://serpapi.com/dashboard).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      // Validate API key format first
      const formatValidation = SerpApiValidator.validateApiKey(auth);
      if (!formatValidation.isValid) {
        return {
          valid: false,
          error: `Invalid API key format: ${formatValidation.errors.join(', ')}`,
        };
      }

      // Test API key with actual request
      const client = new SerpApiClient({
        defaultTimeout: 10000,
        defaultRetries: 1,
      });

      const isValid = await client.validateApiKey(auth);

      if (!isValid) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your SerpApi API key and ensure it has sufficient credits.',
        };
      }

      return {
        valid: true,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      if (errorMessage.includes('timeout')) {
        return {
          valid: false,
          error: 'API validation timed out. Please check your network connection and try again.',
        };
      }

      if (errorMessage.includes('network') || errorMessage.includes('ENOTFOUND')) {
        return {
          valid: false,
          error: 'Network error occurred. Please check your internet connection.',
        };
      }

      return {
        valid: false,
        error: `API key validation failed: ${errorMessage}`,
      };
    }
  },
});

export const serpApi = createPiece({
  displayName: 'SerpApi',
  description: 'Search Google, YouTube, News, and Trends with powerful filtering and analysis capabilities',
  auth: serpApiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/serp-api.png',
  authors: ['AnkitSharmaOnGithub'],
  actions: [
    googleSearch,
    googleNewsSearch,
    youtubeSearch,
    googleTrendsSearch,
  ],
  triggers: [],
});
