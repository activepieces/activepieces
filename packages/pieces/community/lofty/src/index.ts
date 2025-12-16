import { createPiece } from '@activepieces/pieces-framework';
import { loftyAuth } from './lib/common/auth';
import { createLead } from './lib/actions/create-lead';
import { PieceCategory } from '@activepieces/shared';

export const lofty = createPiece({
  displayName: 'Lofty',
  auth: loftyAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/lofty.png',
  categories: [PieceCategory.SALES_AND_CRM],
  authors: ['sanket-a11y'],
  actions: [createLead],
  triggers: [],
});
