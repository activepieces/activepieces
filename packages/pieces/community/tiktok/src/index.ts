import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { postPhotos } from './lib/actions/post-photos';
import { tiktokAuth } from './lib/common';

export const tiktok = createPiece({
  displayName: 'Tiktok',
  auth: tiktokAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/tiktok.png',
  authors: [`worachot.c`],
  actions: [
    postPhotos,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://open.tiktokapis.com/v2';
      },
      auth: tiktokAuth,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [],
});