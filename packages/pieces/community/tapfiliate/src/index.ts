import {
  createCustomApiCallAction,
} from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';

import { createAffiliateAction } from './lib/actions/create-affiliate';
import { createConversionAction } from './lib/actions/create-conversion';
import { getAffiliateAction } from './lib/actions/get-affiliate';
import { listAffiliatesAction } from './lib/actions/list-affiliates';
import { tapfiliateAuth } from './lib/common/auth';
import { TAPFILIATE_BASE_URL } from './lib/common/tapfiliate.client';

export const tapfiliate = createPiece({
  displayName: 'Tapfiliate',
  description: 'Affiliate tracking and conversion management platform.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/tapfiliate.png',
  categories: [PieceCategory.MARKETING, PieceCategory.SALES_AND_CRM],
  authors: ['Harmatta', 'onyedikachi-david'],
  auth: tapfiliateAuth,
  actions: [
    createAffiliateAction,
    getAffiliateAction,
    listAffiliatesAction,
    createConversionAction,
    createCustomApiCallAction({
      baseUrl: () => TAPFILIATE_BASE_URL,
      auth: tapfiliateAuth,
      authMapping: async (auth) => ({
        'X-Api-Key': auth.secret_text,
      }),
    }),
  ],
  triggers: [],
});
