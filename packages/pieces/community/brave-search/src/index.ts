import { createPiece } from '@activepieces/pieces-framework';
import { braveWebSearchAction } from './lib/actions/web-search';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { braveSearchAuth } from './lib/auth';
import { braveSearchCommon } from './lib/common';

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
      baseUrl: () => braveSearchCommon.baseUrl,
      authMapping: async (auth) => {
        return {
          'X-Subscription-Token': auth.secret_text,
        };
      },
      props: {
        url: {
          description: `Full URL, or a path relative to ${braveSearchCommon.baseUrl}`,
          placeholder: '/web/search?q=activepieces',
        },
      },
    }),
  ],
  triggers: [],
});
