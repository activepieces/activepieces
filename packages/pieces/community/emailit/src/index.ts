import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendEmail } from './lib/actions/send-email';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const emailitAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your EmailIt API key from https://app.emailit.com',
  required: true
});
export const emailit = createPiece({
  displayName: 'Emailit',
  description: 'Send transactional emails with EmailIt',
  logoUrl: 'https://cdn.activepieces.com/pieces/emailit.svg',
  categories: [PieceCategory.COMMUNICATION],
  authors: ['dennisklappe','onyedikachi-david'],
  auth: emailitAuth,
  actions: [
    sendEmail,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.emailit.com/v2',
      auth: emailitAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`
      })
    })
  ],
  triggers: []
});
