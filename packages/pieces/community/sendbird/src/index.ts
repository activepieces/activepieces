import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendMessage } from './lib/actions/send-message';
import { listMessages } from './lib/actions/list-messages';
import { sendbirdAuth, SendbirdAuthValue } from './lib/auth';

export const sendbird = createPiece({
  displayName: 'Sendbird',
  description: 'Messaging and chat API platform for building real-time messaging features',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/sendbird.png',
  authors: ['tarai-dl'],
  categories: [PieceCategory.COMMUNICATION],
  auth: sendbirdAuth,
  actions: [
    sendMessage,
    listMessages,
    createCustomApiCallAction({
      baseUrl: (auth) => {
        const { appId } = auth as SendbirdAuthValue;
        return `https://api-${appId}.sendbird.com/v3`;
      },
      auth: sendbirdAuth,
      authMapping: async (auth) => ({
        'Api-Token': (auth as SendbirdAuthValue).apiToken,
      }),
    }),
  ],
  triggers: [],
});
