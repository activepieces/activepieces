import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { braveWebSearchAction } from './lib/actions/web-search';
import { aiSearchWebAction } from './lib/actions/ai-search-web';
import { searchNewsAction } from './lib/actions/search-news';
import { searchImagesAction } from './lib/actions/search-images';
import { searchVideosAction } from './lib/actions/search-videos';
import { getLlmContextAction } from './lib/actions/get-llm-context';
import { braveSearchAuth } from './lib/auth';

export const braveSearch = createPiece({
  displayName: 'Brave Search',
  description: 'Privacy-preserving search engine',
  auth: braveSearchAuth,
  minimumSupportedRelease: '0.86.4',
  logoUrl: 'https://cdn.activepieces.com/pieces/brave-search.png',
  authors: ['ErisMorn', 'sanket-a11y'],
  actions: [
    braveWebSearchAction,
    aiSearchWebAction,
    searchNewsAction,
    searchImagesAction,
    searchVideosAction,
    getLlmContextAction,
    createCustomApiCallAction({
      auth: braveSearchAuth,
      baseUrl: () => 'https://api.search.brave.com/res/v1',
      authMapping: async (auth) => {
        return {
          'X-Subscription-Token': auth.secret_text,
        };
      },
    }),
  ],
  triggers: [],
});
