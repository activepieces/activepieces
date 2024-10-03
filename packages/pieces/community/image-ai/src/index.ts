import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { generateImage } from './lib/actions/generate-image';
import { analyzeImage } from './lib/actions/analyze-image';

export const imageAi = createPiece({
  displayName: 'Image AI',
  auth: PieceAuth.None(),
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/image-ai.svg',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['kishanprmr'],
  actions: [analyzeImage, generateImage],
  triggers: [],
});
