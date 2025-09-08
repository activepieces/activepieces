import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { runwareAuth } from './lib/common/auth';

import { generateImageFromText } from './lib/actions/generate-image';
import { generateImageFromImage } from './lib/actions/generate-image-from-image';
import { generateVideoFromText } from './lib/actions/generate-video-from-text';
import { removeImageBackground } from './lib/actions/remove-image-background';


export const runware = createPiece({
  displayName: 'Runware',
  description: 'Utilize Runware\'s AI infrastructure for image generation and more, directly in your workflows.',
  auth: runwareAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/runware.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: [], 
  actions: [
    generateImageFromText,
    generateImageFromImage,
    generateVideoFromText,
    removeImageBackground,
  ],
  triggers: [
    
  ],
});