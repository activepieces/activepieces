import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { modelsLabAuth } from './lib/common/auth';
import { textToImage } from './lib/actions/text-to-image';

export const modelsLab = createPiece({
  displayName: 'ModelsLab',
  description:
    'ModelsLab is a developer-first AI API platform for text-to-image generation, video creation, voice cloning, and more.',
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/modelslab.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['adhikjoshi'],
  auth: modelsLabAuth,
  actions: [textToImage],
  triggers: [],
});
