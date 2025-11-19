import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { bolnaaiAuth } from './lib/common/auth';

export const bolna = createPiece({
  displayName: 'Bolna AI',
  auth: bolnaaiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bolna.png',
  authors: ['sanket-a11y'],
  actions: [],
  triggers: [],
});
