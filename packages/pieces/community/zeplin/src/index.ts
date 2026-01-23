import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { ziplinAuth } from './lib/common/auth';

export const zeplin = createPiece({
  displayName: 'Zeplin',
  auth: ziplinAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/zeplin.png',
  authors: [],
  actions: [],
  triggers: [],
});
