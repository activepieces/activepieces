import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { verifyEmail } from './lib/actions/verify-email';
import { verifySingleEmail } from './lib/common/send-util';
import { HttpError } from '@activepieces/pieces-common';
import { bulkEmailVerification } from './lib/actions/bulk-email-verification';
import { PieceCategory } from '@activepieces/shared';
import { bulkVerificationResult } from './lib/actions/bulk-email-verification-status';

const description = `
To obtain a Reoon API key, follow these steps:
1. Navigate to [API Setting](https://emailverifier.reoon.com/api-settings).
2. Click on the **Create New API Key** button.
3. Enter a valid title and copy the API key.
`;

export const reoonEmailVerifyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description,
  validate: async (auth) => {
    try {
      await verifySingleEmail('placeholder@test', 'quick', auth.auth);
    } catch (e) {
      const status = (e as HttpError).response.status;

      // Other 4xx status codes mean the API key is valid
      if (status === 401) {
        return {
          valid: false,
          error: 'Your API key is invalid or has expired',
        };
      } else if (status >= 500) {
        return {
          valid: false,
          error: 'An error occurred from the Reoon Email Verifier API',
        };
      }
    }

    return {
      valid: true,
    };
  },
});

export const reoonEmailVerify = createPiece({
  displayName: 'Reoon Email Verifier',
  auth: reoonEmailVerifyAuth,
  minimumSupportedRelease: '0.30.0',
  categories: [PieceCategory.MARKETING],
  logoUrl: 'https://cdn.activepieces.com/pieces/reoon-verifier.png',
  description:
    'Email validation service that cleans invalid, temporary & unsafe email addresses.',
  authors: ['AnneMariel95'],
  actions: [verifyEmail, bulkEmailVerification, bulkVerificationResult],
  triggers: [],
});
