import { createPiece } from '@activepieces/pieces-framework';

import { neverbounceAuth } from './lib/common/auth';

import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { verifyEmailAddress } from './lib/actions/verify-email-address';
import { PieceCategory } from '@activepieces/shared';

export const neverbounce = createPiece({
  displayName: 'NeverBounce',
  auth: neverbounceAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/neverbounce.png',
  categories: [PieceCategory.COMMUNICATION],
  description:
    'NeverBounce is an email verification service that improves deliverability and helps businesses adhere to strict deliverability guidelines.',
  authors: ['sanket-a11y'],
  actions: [
    verifyEmailAddress,
    createCustomApiCallAction({
      auth: neverbounceAuth,
      baseUrl: () => 'https://api.neverbounce.com/v4.2',
      authLocation: 'queryParams',
      authMapping: async (auth) => {
        return {
          key: auth.secret_text,
        };
      },
    }),
  ],
  triggers: [],
});
