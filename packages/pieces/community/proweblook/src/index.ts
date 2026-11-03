import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { checkWhatsappAction } from './lib/actions/check-whatsapp';
import { getBalanceAction } from './lib/actions/get-balance';
import { validatePhoneAction } from './lib/actions/validate-phone';
import { verifyEmailAction } from './lib/actions/verify-email';
import { proweblookAuth } from './lib/auth';
import { PROWEBLOOK_BASE_URL } from './lib/common/client';

export const proweblook = createPiece({
  displayName: 'ProWebLook',
  description:
    'Verify email addresses, validate phone numbers, check WhatsApp registration, and inspect credit balances with ProWebLook.',
  minimumSupportedRelease: '0.82.0',
  logoUrl:
    'https://raw.githubusercontent.com/dubeychandan996/proweblook-mcp/main/assets/logo.png',
  categories: [PieceCategory.MARKETING, PieceCategory.COMMUNICATION],
  authors: ['dubeychandan996'],
  auth: proweblookAuth,
  actions: [
    verifyEmailAction,
    validatePhoneAction,
    checkWhatsappAction,
    getBalanceAction,
    createCustomApiCallAction({
      baseUrl: () => PROWEBLOOK_BASE_URL,
      auth: proweblookAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
