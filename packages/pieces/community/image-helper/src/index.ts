import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { imageToBase64 } from './lib/actions/image-to-base64.action';

export const imageHelper = createPiece({
  displayName: 'Image Helper',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/image-helper.png',
  authors: ['PFernandez98'],
  categories: [PieceCategory.OTHER],
  actions: [imageToBase64],
  triggers: [],
});
