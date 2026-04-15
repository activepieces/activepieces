import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { generateVideo } from './lib/actions/generate-video';
import { generatePodcast } from './lib/actions/generate-podcast';
import { generateAiImage } from './lib/actions/generate-ai-image';
import { generateAiCaptions } from './lib/actions/generate-ai-captions';
import { PieceCategory } from '@activepieces/shared';
import { vadooAiAuth } from './lib/auth';

export const vadooAi = createPiece({
  displayName: 'Vadoo AI',
  auth: vadooAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/vadoo-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['fortunamide'],
  actions: [
    generateVideo,
    generatePodcast,
    generateAiImage,
    generateAiCaptions,
  ],
  triggers: [],
});
