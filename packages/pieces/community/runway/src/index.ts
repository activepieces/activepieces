import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { cancelOrDeleteATask } from './lib/actions/cancel-or-delete-a-task';
import { generateVideoFromImage } from './lib/actions/generate-a-video-from-image';
import { generateImageFromText } from './lib/actions/generate-image-from-text';
import { getTaskDetails } from './lib/actions/get-task-details';
import { runwayAuth } from './lib/common';

export const runway = createPiece({
  displayName: 'Runway',
  description: 'Runway is an AI-powered content generation platform for creating high-quality images using text prompts and managing generation tasks.',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE, PieceCategory.CONTENT_AND_FILES],
  auth: runwayAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/runway.png',
  authors: ['LuizDMM'],
  actions: [
    generateImageFromText,
    generateVideoFromImage,
    getTaskDetails,
    cancelOrDeleteATask,
  ],
  triggers: [],
});
