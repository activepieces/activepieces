import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { sendReviewInvite } from './lib/actions/send-review-invite';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { cloutlyAuth } from './lib/auth';

export const cloutly = createPiece({
  displayName: 'Cloutly',
  description: 'Review Management Tool',
  auth: cloutlyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cloutly.svg',
  categories: [PieceCategory.MARKETING],
  authors: ['joshuaheslin'],
  actions: [
    sendReviewInvite,
    createCustomApiCallAction({
      baseUrl: () => {
        return 'https://app.cloutly.com/api/v1';
      },
      auth: cloutlyAuth,
      authMapping: async (auth) => ({
        'x-app': 'activepieces',
        'x-api-key': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
