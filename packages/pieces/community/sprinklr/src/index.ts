import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece, PieceCategory } from '@activepieces/pieces-framework';
import { sprinklrAuth } from './lib/auth';
import { sprinklrClient } from './lib/common/client';

export const sprinklr = createPiece({
  displayName: 'Sprinklr',
  description: 'Customer experience platform for customer service, social media and marketing.',
  auth: sprinklrAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/sprinklr.png',
  categories: [PieceCategory.CUSTOMER_SUPPORT, PieceCategory.SALES_AND_CRM],
  authors: ['ibrahim-abuznaid'],
  actions: [
    createCustomApiCallAction({
      auth: sprinklrAuth,
      baseUrl: (auth) => sprinklrClient.customApiBaseUrl(auth),
      authMapping: async (auth) => sprinklrClient.customApiAuthMapping(auth),
    }),
  ],
  triggers: [],
});
