import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory, createPiece } from '@activepieces/pieces-framework';
import { createChatTask } from './lib/actions/create-chat-task';
import { postChatMessage } from './lib/actions/post-chat-message';
import { sendSms } from './lib/actions/send-sms';
import { RINGCENTRAL_API_BASE, ringcentralAuth } from './lib/common/auth';

export const ringcentral = createPiece({
  displayName: 'RingCentral',
  description:
    'Cloud communications platform for SMS, voice, and team messaging.',
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/ringcentral.png',
  categories: [PieceCategory.COMMUNICATION],
  auth: ringcentralAuth,
  authors: ['sheuabdulazeez'],
  actions: [
    sendSms,
    postChatMessage,
    createChatTask,
    createCustomApiCallAction({
      auth: ringcentralAuth,
      baseUrl: () => RINGCENTRAL_API_BASE,
      authMapping: async (auth) => {
        const { access_token } = auth as { access_token: string };
        return { Authorization: `Bearer ${access_token}` };
      },
    }),
  ],
  triggers: [],
});
