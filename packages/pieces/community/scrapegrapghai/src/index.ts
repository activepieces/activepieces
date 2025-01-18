import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { smartScraper } from './lib/actions/smart-scraper';
import { localScraper } from './lib/actions/local-scraper';
import { markdownify } from './lib/actions/markdownify';

const markdownDescription = `
Follow these instructions to get your ScrapeGraphAI API Key:

1. Visit https://scrapegraphai.com and sign up for an account
2. Navigate to your dashboard
3. Copy your API key
`;

export const scrapegraphaiAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.scrapegraphai.com/v1/smartscraper',
        headers: {
          'Content-Type': 'application/json',
          'SGAI-APIKEY': auth,
        },
        body: {
          user_prompt: 'test',
          website_url: 'https://www.example.com',
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});

export const scrapegraphai = createPiece({
  displayName: 'ScrapeGraphAI',
  description: 'AI-powered web scraping and content extraction',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/scrapegraphai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["OsamaHaikal"],
  auth: scrapegraphaiAuth,
  actions: [
    smartScraper,
    localScraper,
    markdownify,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.scrapegraphai.com/v1',
      auth: scrapegraphaiAuth,
      authMapping: async (auth) => ({
        'SGAI-APIKEY': `${auth}`,
      }),
    }),
  ],
  triggers: [],
});
    