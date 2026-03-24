import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { telnyxAuth } from './lib/auth';
import { sendSmsAction } from './lib/actions/send-sms';
import { makeCallAction } from './lib/actions/make-call';
import { messageReceivedTrigger } from './lib/triggers/message-received';

export const telnyx = createPiece({
  displayName: 'Telnyx',
  description:
    'Telecom API platform for SMS messaging, voice calls, and messaging webhooks.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://www.telnyx.com/favicon.ico',
  categories: [PieceCategory.COMMUNICATION, PieceCategory.DEVELOPER_TOOLS],
  auth: telnyxAuth,
  authors: ['Harmatta'],
  actions: [
    sendSmsAction,
    makeCallAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.telnyx.com/v2',
      auth: telnyxAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as { secret_text: string }).secret_text}`,
      }),
    }),
  ],
  triggers: [messageReceivedTrigger],
});
