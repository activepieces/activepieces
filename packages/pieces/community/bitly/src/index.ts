import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { bitlyAuth } from './lib/common/auth';
import { newBitlinkCreatedTrigger } from './lib/triggers/new-bitlink-created';
import { archiveBitlinkAction } from './lib/actions/archive-bitlink';
import { createBitlinkAction } from './lib/actions/create-bitlink';
import { createQrCodeAction } from './lib/actions/create-qr-code';
import { getBitlinkDetailsAction } from './lib/actions/get-bitlink-details';
import { updateBitlinkAction } from './lib/actions/update-bitlink';
import { getBitlinkClicksAction } from './lib/actions/get-bitlink-clicks';
import { aiListGroupsAction } from './lib/actions/ai/ai-list-groups';
import { aiSearchBitlinksAction } from './lib/actions/ai/ai-search-bitlinks';
import { aiGetBitlinkAction } from './lib/actions/ai/ai-get-bitlink';
import { aiShortenUrlAction } from './lib/actions/ai/ai-shorten-url';
import { aiUpdateBitlinkAction } from './lib/actions/ai/ai-update-bitlink';
import { aiGetBitlinkClicksAction } from './lib/actions/ai/ai-get-bitlink-clicks';
import { aiListQrCodesAction } from './lib/actions/ai/ai-list-qr-codes';
import { aiCreateQrCodeAction } from './lib/actions/ai/ai-create-qr-code';

export const bitly = createPiece({
  displayName: 'Bitly',
  description: 'URL shortening and link management platform with analytics.',
  auth: bitlyAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/bitly.png',
  authors: ['aryel780'],
  categories: [PieceCategory.MARKETING],
  actions: [
    archiveBitlinkAction,
    createBitlinkAction,
    createQrCodeAction,
    getBitlinkDetailsAction,
    updateBitlinkAction,
    getBitlinkClicksAction,
    aiListGroupsAction,
    aiSearchBitlinksAction,
    aiGetBitlinkAction,
    aiShortenUrlAction,
    aiUpdateBitlinkAction,
    aiGetBitlinkClicksAction,
    aiListQrCodesAction,
    aiCreateQrCodeAction,
    createCustomApiCallAction({
      auth: bitlyAuth,
      baseUrl: () => 'https://api-ssl.bitly.com/v4',
      authMapping: async (auth) => {
        const { accessToken } = auth.props;
        return {
          Authorization: `Bearer ${accessToken}`,
        };
      },
    }),
  ],
  triggers: [newBitlinkCreatedTrigger],
});
