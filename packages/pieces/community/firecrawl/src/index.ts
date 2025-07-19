import { createCustomApiCallAction, httpClient, HttpMethod } from '@ensemble/pieces-common';
import { createPiece, PieceAuth } from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import { scrape } from './lib/actions/scrape';
import { startCrawl } from './lib/actions/start-crawl';
import { crawlResults } from './lib/actions/crawl-results';

const markdownDescription = `
Follow these steps to obtain your Firecrawl API Key:

1. Visit [Firecrawl](https://firecrawl.dev) and create an account.
2. Log in and navigate to your dashboard.
3. Locate and copy your API key from the API settings section.
`;

export const firecrawlAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.firecrawl.dev/v1/scrape',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth}`,
        },
        body: {
          url: 'https://www.example.com',
          formats: ['json'],
          jsonOptions: {
            prompt: 'test'
          }
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

export const firecrawl = createPiece({
  displayName: 'Firecrawl',
  description: 'Extract structured data from websites using AI with natural language prompts',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/firecrawl.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["geekyme-fsmk", "geekyme"],
  auth: firecrawlAuth,
  actions: [
    scrape,
    startCrawl,
    crawlResults,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.firecrawl.dev/v1',
      auth: firecrawlAuth,
      authMapping: async (auth) => ({
        'Authorization': `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});