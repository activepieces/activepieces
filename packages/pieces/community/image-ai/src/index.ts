import { createPiece, PieceAuth } from '@ensemble/pieces-framework';
import { PieceCategory } from '@ensemble/shared';
import { generateImageAction } from './lib/actions/generate-image';

export const imageAi = createPiece({
  displayName: 'Image AI',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.63.0',
  logoUrl: 'https://cdn.ensemble.com/pieces/image-ai.svg',
  categories: [
    PieceCategory.ARTIFICIAL_INTELLIGENCE,
    PieceCategory.UNIVERSAL_AI,
  ],
  authors: ['kishanprmr', 'amrdb'],
  actions: [generateImageAction],
  triggers: [],
});
