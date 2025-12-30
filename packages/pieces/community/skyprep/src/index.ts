import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { skyprepAuth } from './lib/common/auth';

export const skyprep = createPiece({
  displayName: 'SkyPrep',
  auth: skyprepAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/skyprep.png',
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [],
});
