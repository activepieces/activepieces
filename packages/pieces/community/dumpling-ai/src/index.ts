import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { searchWeb, searchNews, generateImage, scrapeWebsite, crawlWebsite, extractDocumentData } from './lib/actions';
import { DUMPLING_API_URL } from './lib/common/constants';

const markdownDescription = `
Follow these steps to obtain your Dumpling AI API Key:

1. Create a free account at [Dumpling AI](https://www.dumplingai.com/)
2. Navigate to Dashboard > Settings section
3. Copy your API key for development and testing purposes
`;

export const dumplingAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      // We'll use the search endpoint for validation as it should be a simple call
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: `${DUMPLING_API_URL}/search`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${auth}`,
        },
        body: {
          query: 'test query'
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

export const dumplingAi = createPiece({
  displayName: 'Dumpling AI',
  description: 'AI agent platform for data extraction, content generation, and workflow automation',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/dumpling-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['kishanprmr'],
  auth: dumplingAuth,
  actions: [
    searchWeb,
    searchNews,
    generateImage,
    scrapeWebsite,
    crawlWebsite,
    extractDocumentData,
    createCustomApiCallAction({
      auth: dumplingAuth,
      baseUrl: () => DUMPLING_API_URL,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [],
}); 