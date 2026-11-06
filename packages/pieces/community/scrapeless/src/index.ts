import { createPiece } from '@activepieces/pieces-framework';
import { googleSearchApi } from './lib/actions/google-search-api';
import { crawlScrapeApi } from './lib/actions/crawl-scrape';
import { crawlCrawlApi } from './lib/actions/crawl-crawl';
import { googleTrendsApi } from './lib/actions/google-trends-api';
import { universalScrapingApi } from './lib/actions/universal-scraping-api';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/pieces-framework';
import { scrapelessApiAuth } from './lib/auth';
import { aiScraperAction } from './lib/actions/ai-scraper';

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
    aiScraperAction,
    createCustomApiCallAction({
      auth:scrapelessApiAuth,
      baseUrl:()=>'https://api.scrapeless.com/api/v1',
      authMapping:async(auth)=>{
        return{
          'x-api-token':auth.secret_text
        }
      }
    })
  ],
  triggers: [],
});
