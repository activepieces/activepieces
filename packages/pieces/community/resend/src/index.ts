import { createCustomApiCallAction } from '@ensemble/pieces-common';
import { PieceAuth, createPiece } from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import { sendEmail } from './lib/actions/send-email';

export const resendAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
});

export const resend = createPiece({
  displayName: 'Resend',
  description: 'Email for developers',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/resend.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE, PieceCategory.MARKETING],
  authors: ["kishanprmr","MoShizzle","khaledmashaly","abuaboud"],
  auth: resendAuth,
  actions: [
    sendEmail,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.resend.com',
      auth: resendAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth}`,
      }),
    }),
  ],
  triggers: [],
});
