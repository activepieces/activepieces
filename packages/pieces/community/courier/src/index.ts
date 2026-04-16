import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { courierAuth } from './lib/common/auth';
import { sendMessage } from './lib/actions/send-message';
import { getMessage } from './lib/actions/get-message';
import { listMessages } from './lib/actions/list-messages';

export const courier = createPiece({
  displayName: 'Courier',
  description: 'Multi-channel notification API for sending notifications across email, SMS, push, and Slack.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/courier.png',
  categories: [PieceCategory.MARKETING],
  authors: ['tarai-dl'],
  auth: courierAuth,
  actions: [
    sendMessage,
    getMessage,
    listMessages,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.courier.com',
      auth: courierAuth,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
        };
      },
    }),
  ],
  triggers: [],
});
