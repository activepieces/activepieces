import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { cryptolensAuth } from './lib/common/auth';

export const cryptolens = createPiece({
  displayName: 'Cryptolens',
  auth: cryptolensAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/cryptolens.png',
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [],
});
