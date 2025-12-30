import { createPiece } from '@activepieces/pieces-framework';
import { influencersClubAuth } from './lib/common/auth';
import { enrichCreatorByEmail } from './lib/actions/enrich-creator-by-email';
import { enrichCreatorByHandle } from './lib/actions/enrich-creator-by-handle';
import { findSimilarCreator } from './lib/actions/find-similar-creator';
import { PieceCategory } from '@activepieces/shared';

export const influencersClub = createPiece({
  displayName: 'Influencers.club',
  auth: influencersClubAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/influencers-club.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['sanket-a11y'],
  actions: [enrichCreatorByEmail, enrichCreatorByHandle, findSimilarCreator],
  triggers: [],
});
