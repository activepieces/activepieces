import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { hunterIoAuth } from './lib/common/auth';
import { addRecipientsAction } from './lib/actions/add-recipients';

export const hunterIo = createPiece({
  displayName: 'Hunter',
  auth: hunterIoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/hunter.png',
  authors: ['activepieces-community'],
  actions: [
    addRecipientsAction,
    
    createCustomApiCallAction({
      auth: hunterIoAuth,
      baseUrl: () => 'https://api.hunter.io/v2',
      authMapping: async (auth) => {
        const { apiKey } = auth as { apiKey: string };
        return {
          'api_key': apiKey,
        };
      },
    }),
  ],
  triggers: [],
});
