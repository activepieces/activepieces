import { createPiece } from '@activepieces/pieces-framework';

import { googleSearch } from './lib/actions/google-search';
import { googleNewsSearch } from './lib/actions/google-news-search';
import { googleTrendsSearch } from './lib/actions/google-trends-search';
import { youtubeSearch } from './lib/actions/youtube-search';
import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';


const BASE_URL = 'https://serpapi.com/api';

export const serpapiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your API key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/workspaces`,
        headers: {
          'X-API-Key': auth,
        },
      });

      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key.',
      };
    }
  },
});

export const serpapi = createPiece({
  displayName: 'SerpAPI',
  auth: serpapiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/serpapi.png',
  authors: [],
  actions: [googleSearch, googleNewsSearch, youtubeSearch, googleTrendsSearch],
  triggers: [],
});
