import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { brevoAuth } from './lib/auth';
import { BREVO_API_BASE_URL } from './lib/common/client';
import { createContactAction } from './lib/actions/create-contact';
import { getContactAction } from './lib/actions/get-contact';
import { sendEmailAction } from './lib/actions/send-email';

export const brevo = createPiece({
  displayName: 'Brevo',
  description: 'Email and SMS marketing platform for transactional messages and contact management.',
  auth: brevoAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/brevo.png',
  authors: ['Harmatta'],
  categories: [PieceCategory.COMMUNICATION],
  actions: [
    sendEmailAction,
    createContactAction,
    getContactAction,
    createCustomApiCallAction({
      auth: brevoAuth,
      baseUrl: () => BREVO_API_BASE_URL,
      authMapping: async (auth) => ({
        'api-key': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
