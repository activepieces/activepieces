import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  AuthenticationType,
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';

// Actions
import { searchWeb } from './lib/actions/search-web';
import { searchNews } from './lib/actions/search-news';
import { generateImage } from './lib/actions/generate-image';
import { scrapeWebsite } from './lib/actions/scrape-website';
import { crawlWebsite } from './lib/actions/crawl-website';
import { extractDocumentData } from './lib/actions/extract-document-data';
import { BASE_URL, apiHeaders } from './lib/common/common';

const markdownDescription = `
Follow these steps to obtain your Dumpling AI API Key:

1. Create a free account at [Dumpling AI](https://www.dumplingai.com/)
2. Navigate to Dashboard > Settings section
3. Copy your API key for development and testing purposes
`;

export const dumplingaiAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/me`,
        headers: apiHeaders(auth),
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

export const dumplingai = createPiece({
  displayName: 'Dumpling AI',
  description: 'AI agent platform for data extraction, content generation, and workflow automation',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/dumplingai.png', // Need to add logo to CDN
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['kishanprmr'],
  auth: dumplingaiAuth,
  actions: [
    searchWeb,
    searchNews,
    generateImage,
    scrapeWebsite,
    crawlWebsite,
    extractDocumentData,
    createCustomApiCallAction({
      auth: dumplingaiAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [],
}); 