import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { bitlyAuth } from './lib/common/auth';
import { newBitlinkCreatedTrigger } from './lib/triggers/new-bitlink-created';
import { archiveBitlinkAction } from './lib/actions/archive-bitlink';
import { createBitlinkAction } from './lib/actions/create-bitlink';
import { createQrCodeAction } from './lib/actions/create-qr-code';
import { getBitlinkDetailsAction } from './lib/actions/get-bitlink-details';
import { updateBitlinkAction } from './lib/actions/update-bitlink';

export const bitly = createPiece({
  displayName: 'Bitly',
  description: 'URL shortening and link management platform with analytics.',
  auth: bitlyAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/bitly.png',
  authors: ['aryel780'],
  categories: [PieceCategory.MARKETING],
  actions: [
    archiveBitlinkAction,
    createBitlinkAction,
    createQrCodeAction,
    getBitlinkDetailsAction,
    updateBitlinkAction,
    createCustomApiCallAction({
      auth: bitlyAuth,
      baseUrl: () => 'https://api-ssl.bitly.com/v4',
      authMapping: async (auth) => {
        const { accessToken } = auth as { accessToken: string };
        return {
          Authorization: `Bearer ${accessToken}`,
        };
      },
    }),
  ],
  triggers: [ newBitlinkCreatedTrigger ],
});
