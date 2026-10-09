import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { scrapegraphaiAuth } from './lib/auth';
import { scrapegraphaiClient } from './lib/common/client';
import { smartScraperAction } from './lib/actions/smart-scraper';
import { localScraperAction } from './lib/actions/local-scraper';
import { markdownifyAction } from './lib/actions/convert-to-markdown';

export const scrapegraphai = createPiece({
  displayName: 'ScrapeGraphAI',
  description: 'AI-powered web scraping and content extraction.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/scrapegraphai.jpg',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["OsamaHaikal"],
  auth: scrapegraphaiAuth,
  actions: [
    smartScraperAction,
    localScraperAction,
    markdownifyAction,
    createCustomApiCallAction({
      baseUrl: () => scrapegraphaiClient.baseUrl(),
      auth: scrapegraphaiAuth,
      authMapping: async (auth) => ({
        'SGAI-APIKEY': `${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
