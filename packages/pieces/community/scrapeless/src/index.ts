import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { ScrapelessValidator } from './lib/utils/validator';
import { googleSearchApi } from './lib/actions/google-search-api';
import { crawlScrapeApi } from './lib/actions/crawl-scrape';
import { crawlCrawlApi } from './lib/actions/crawl-crawl';
import { googleTrendsApi } from './lib/actions/google-trends-api';
import { universalScrapingApi } from './lib/actions/universal-scraping-api';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';

export const scrapelessApiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `You can obtain your API key from [Dashboard](https://app.scrapeless.com).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      // Validate API key format first
      const formatValidation = await ScrapelessValidator.validateApiKey(auth);
      if (!formatValidation.isValid) {
        return {
          valid: false,
          error: `${formatValidation.errors.join(', ')}`,
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

export const scrapeless = createPiece({
  displayName: 'Scrapeless',
  description:
    'Scrapeless is an all-in-one and highly scalable web scraping toolkit for enterprises and developers.',
  auth: scrapelessApiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/scrapeless.png',
  categories:[PieceCategory.PRODUCTIVITY],
  authors: ['sunorains'],
  actions: [
    googleSearchApi,
    crawlScrapeApi,
    crawlCrawlApi,
    googleTrendsApi,
    universalScrapingApi,
    createCustomApiCallAction({
      auth:scrapelessApiAuth,
      baseUrl:()=>'https://api.scrapeless.com/api/v1',
      authMapping:async(auth)=>{
        return{
          'x-api-token':auth as string
        }
      }
    })
  ],
  triggers: [],
});
