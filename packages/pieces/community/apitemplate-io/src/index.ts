import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { ApitemplateAuth } from './lib/common/auth';

export const apitemplateIo = createPiece({
  displayName: 'Apitemplate-io',
  auth: ApitemplateAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/apitemplate-io.png',
  authors: ['Sanket6652'],
  actions: [],
  triggers: [],
});
