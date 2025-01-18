import { createCustomApiCallAction, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { search } from './lib/actions/search';
import { extract } from './lib/actions/extract';

const markdownDescription = `
Follow these instructions to get your Tavily API Key:

1. Visit https://tavily.com/ and sign up for an account
2. Navigate to your dashboard
3. Copy your API key from the dashboard
`;

export const tavilyAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://api.tavily.com/search',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          api_key: auth,
          query: 'test',
          search_depth: 'basic'
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

export const tavily = createPiece({
  displayName: 'Tavily',
  description: 'AI-powered search engine for accurate and real-time information',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/tavily.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["OsamaHaikal"],
  auth: tavilyAuth,
  actions: [
    search,
    extract,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.tavily.com',
      auth: tavilyAuth,
    }),
  ],
  triggers: [],
});
    