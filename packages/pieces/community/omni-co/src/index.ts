import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { omniAuth } from './lib/common/auth';

export const omniCo = createPiece({
  displayName: 'Omni',
  auth: omniAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/omni-co.png',
  categories: [PieceCategory.BUSINESS_INTELLIGENCE],
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [],
});
