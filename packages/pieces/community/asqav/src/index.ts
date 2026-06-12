import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceCategory } from '@activepieces/shared';
import { asqavAuth } from './lib/auth';
import { signAction } from './lib/actions/sign-action';
import { verifySignature } from './lib/actions/verify-signature';
import { ASQAV_BASE_URL } from './lib/common';

export const asqav = createPiece({
  displayName: 'Asqav',
  description:
    'Sign AI agent actions and verify the tamper-evident receipts that prove what each agent did.',
  auth: asqavAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/asqav.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['jagmarques'],
  actions: [
    signAction,
    verifySignature,
    createCustomApiCallAction({
      baseUrl: () => ASQAV_BASE_URL,
      auth: asqavAuth,
      authMapping: async (auth) => ({
        'X-API-Key': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});