import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { runwareAuth } from './lib/auth';
import { generateImagesFromText } from './lib/actions/generate-images-from-text';
import { generateImagesFromImage } from './lib/actions/generate-images-from-existing-image';
import { generateVideoFromText } from './lib/actions/generate-video-from-text';
import { removeImageBackground } from './lib/actions/image-background-removal';

export const runware = createPiece({
  displayName: 'Runware AI',
  description:
    'Generate images and videos, and remove backgrounds with Runware AI.',
  auth: runwareAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://runware.ai/favicon.ico',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['sudarshan-magar7'],
  actions: [
    generateImagesFromText,
    generateImagesFromImage,
    generateVideoFromText,
    removeImageBackground,
  ],
  triggers: [],
});