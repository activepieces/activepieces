import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { braveWebSearchAction } from './lib/actions/web-search';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const braveSearchAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'Your Brave Search API Key (get it from https://brave.com/search/api/)',
});

export const braveSearch = createPiece({
  displayName: 'Brave Search',
  description: 'Privacy-preserving search engine',
  auth: braveSearchAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/brave-search.png',
  authors: ['ErisMorn', 'sanket-a11y'],
  actions: [
    braveWebSearchAction,
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
