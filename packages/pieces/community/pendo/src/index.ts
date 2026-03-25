import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { pendoAuth } from './lib/auth';
import { trackEvent } from './lib/actions/track-event';
import { getVisitor } from './lib/actions/get-visitor';
import { getAccount } from './lib/actions/get-account';
import { listGuides } from './lib/actions/list-guides';

export const pendo = createPiece({
  displayName: 'Pendo',
  description: 'Product analytics and digital adoption platform',
  auth: pendoAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pendo.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['Harmatta'],
  actions: [
    trackEvent,
    getVisitor,
    getAccount,
    listGuides,
    createCustomApiCallAction({
      baseUrl: () => 'https://app.pendo.io/api/v1',
      auth: pendoAuth,
      authMapping: async (auth) => ({
        'x-pendo-integration-key': String(auth),
      }),
    }),
  ],
  triggers: [],
});
