import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PaperformAuth } from './lib/common/auth';

export const paperform = createPiece({
  displayName: 'Paperform',
  auth: PaperformAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/paperform.png',
  authors: ['Sanket6652'],
  actions: [],
  triggers: [],
});
