import { createPiece } from '@activepieces/pieces-framework';
import { generateImagesFromExistingImage } from './lib/actions/generate-images-from-existing-image';
import { generateImagesFromText } from './lib/actions/generate-images-from-text';
import { generateVideoFromText } from './lib/actions/generate-video-from-text';
import { imageBackgroundRemoval } from './lib/actions/image-background-removal';
import { runwareAuth } from './lib/common';

export const runware = createPiece({
  displayName: 'Runware',
  auth: runwareAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/runware.png',
  authors: ['LuizDMM'],
  actions: [
    generateImagesFromText,
    generateImagesFromExistingImage,
    generateVideoFromText,
    imageBackgroundRemoval, // TODO
  ],
  triggers: [],
});
