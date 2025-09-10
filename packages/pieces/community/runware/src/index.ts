import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { generateImagesFromExistingImage } from './lib/actions/generate-images-from-existing-image';
import { generateImagesFromText } from './lib/actions/generate-images-from-text';
import { generateVideoFromText } from './lib/actions/generate-video-from-text';
import { imageBackgroundRemoval } from './lib/actions/image-background-removal';
import { runwareAuth } from './lib/common';

export const runware = createPiece({
  displayName: 'Runware',
  description:'Runware.AI is a high-performance, cost-effective AI media generation API specializing in images and videos. Through this integration, workflows can automatically generate visuals via text or image prompts and interact with Runware’s full-featured API.',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: runwareAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/runware.png',
  authors: ['LuizDMM','sanket-a11y'],
  actions: [ 
    generateImagesFromText,
    generateImagesFromExistingImage,
    generateVideoFromText,
    imageBackgroundRemoval,
  ],
  triggers: [],
});
