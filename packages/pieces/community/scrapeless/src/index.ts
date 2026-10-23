import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { crawlWebsiteAction } from './lib/actions/crawl-website';
import { getGoogleTrendsAction } from './lib/actions/get-google-trends';
import { scrapeWebpageAction } from './lib/actions/scrape-webpage';
import { searchGoogleAction } from './lib/actions/search-google';
import { universalScrapeAction } from './lib/actions/universal-scrape';
import { scrapelessApiAuth } from './lib/auth';
import { scrapelessClient } from './lib/common/client';

export const scrapeless = createPiece({
  displayName: 'Scrapeless',
  description:
    'Scrapeless is an all-in-one and highly scalable web scraping toolkit for enterprises and developers.',
  auth: scrapelessApiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/scrapeless.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['sunorains'],
  actions: [
    searchGoogleAction,
    scrapeWebpageAction,
    crawlWebsiteAction,
    getGoogleTrendsAction,
    universalScrapeAction,
    createCustomApiCallAction({
      auth: scrapelessApiAuth,
      baseUrl: () => scrapelessClient.baseUrl(),
      authMapping: async (auth) => {
        return {
          'x-api-token': auth.secret_text,
        };
      },
    }),
  ],
  triggers: [],
});
