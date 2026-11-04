import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { millionVerifierAuth } from './lib/auth';
import { millionVerifierClient } from './lib/common/client';
import { verifyEmail } from './lib/actions/verify-email';

export const millionverifier = createPiece({
  displayName: 'MillionVerifier',
  auth: millionVerifierAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/millionverifier.png',
  authors: ['sanket-a11y'],
  categories: [PieceCategory.COMMUNICATION],
  description: 'MillionVerifier is an email verifier service and API',
  actions: [
    verifyEmail,
    createCustomApiCallAction({
      auth: millionVerifierAuth,
      baseUrl: () => millionVerifierClient.baseUrl(),
      authLocation: 'queryParams',
      authMapping: async (auth) => ({
        api: auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
