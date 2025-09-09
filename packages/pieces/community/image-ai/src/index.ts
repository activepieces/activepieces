import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { generateImageAction } from './lib/actions/generate-image';

export const imageAi = createPiece({
  displayName: 'Image AI',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.68.3',
  logoUrl: 'https://cdn.activepieces.com/pieces/image-ai.svg',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
  authors: ['kishanprmr', 'amrdb'],
  actions: [generateImageAction],
  triggers: [],
});
