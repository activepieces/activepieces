import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { telnyxAuth } from './lib/auth';
import { telnyxClient } from './lib/common/client';
import { sendSmsAction } from './lib/actions/send-sms';
import { makeCallAction } from './lib/actions/make-call';
import { telnyxAiActions } from './lib/actions/ai';
import { messageReceivedTrigger } from './lib/triggers/message-received';

export const telnyx = createPiece({
  displayName: 'Telnyx',
  description:
    'Telecom API platform for SMS messaging, voice calls, and messaging webhooks.',
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/telnyx.png',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.DEVELOPER_TOOLS],
  auth: telnyxAuth,
  authors: ['Harmatta', 'sanket-a11y'],
  actions: [
    sendSmsAction,
    makeCallAction,
    ...telnyxAiActions,
    createCustomApiCallAction({
      baseUrl: () => telnyxClient.baseUrl(),
      auth: telnyxAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [messageReceivedTrigger],
});
