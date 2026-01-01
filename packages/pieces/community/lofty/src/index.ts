import { createPiece } from '@activepieces/pieces-framework';
import { loftyAuth } from './lib/common/auth';
import { createLead } from './lib/actions/create-lead';
import { PieceCategory } from '@activepieces/shared';
import { createTransaction } from './lib/actions/create-transaction';
import { updateLead } from './lib/actions/update-lead';
import { updateTransaction } from './lib/actions/update-transaction';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const lofty = createPiece({
  displayName: 'Lofty',
  auth: loftyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/lofty.png',
  categories: [PieceCategory.SALES_AND_CRM],
  description:
    'Lofty is a product of the technology company Lofty Inc, which offers a complete tech solution for real estate agents.',
  authors: ['sanket-a11y'],
  actions: [
    createLead,
    createTransaction,
    updateLead,
    updateTransaction,
    createCustomApiCallAction({
      auth: loftyAuth,
      baseUrl: () => 'https://api.lofty.ai/v1',
      authMapping: async (auth) => ({
        Authorization: `token ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
