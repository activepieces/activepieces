import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { launchPhantom } from './lib/actions/launch-phantom';
import { phantombusterAuth } from './lib/common/auth';
import { newOutput } from './lib/triggers/new-output';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { BASE_URL } from './lib/common/client';
import { PieceCategory } from '@activepieces/shared';

export const phantombuster = createPiece({
  displayName: 'PhantomBuster',
  auth: phantombusterAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/phantombuster.png',
  description: 'Automate your web scraping and web automation tasks',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
  authors: ['sanket-a11y'],
  actions: [
    launchPhantom,
    createCustomApiCallAction({
      auth: phantombusterAuth,
      baseUrl: () => BASE_URL,
      authMapping: async (auth) => {
        const apiKey = auth;
        return {
          'X-Phantombuster-Key': `${apiKey.secret_text}`,
          'Content-Type': 'application/json',
        };
      },
    }),
  ],
  triggers: [newOutput],
});
