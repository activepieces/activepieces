import {
  createCustomApiCallAction
} from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { shortIoAuth } from './lib/common/auth';

export const shortIo = createPiece({
  displayName: 'Short.io',
  auth: shortIoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/short-io.png',
  authors: ['aryel780'],
  actions: [
    // yourActionsHere,
    createCustomApiCallAction({
      auth: shortIoAuth,
      baseUrl: () => 'https://api.short.io',
      authMapping: async (auth) => {
        const { apiKey } = auth as { apiKey: string };
        return {
          Authorization: apiKey,
        };
      },
    }),
  ],
  triggers: [],
});
