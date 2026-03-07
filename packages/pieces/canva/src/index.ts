import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createDesign } from './lib/actions/create-design';
import { uploadAsset } from './lib/actions/upload-asset';
import { canvaAuth } from './lib/auth';

export const canva = createPiece({
  displayName: 'Canva',
  auth: canvaAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/canva.png',
  authors: ['activepieces'],
  actions: [createDesign, uploadAsset],
  triggers: [],
});