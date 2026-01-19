import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { sendEmail } from './lib/actions/send-email';

export const emailitAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your EmailIt API key from https://app.emailit.com',
  required: true,
});

export const emailit = createPiece({
  displayName: 'EmailIt',
  description: 'Send transactional emails with EmailIt',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/emailit.svg',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['dennisklappe'],
  auth: emailitAuth,
  actions: [
    sendEmail,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.emailit.com/v2',
      auth: emailitAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
