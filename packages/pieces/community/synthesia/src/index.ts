import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { synthesiaAuth } from './lib/common/auth';
import { createAVideoFromATemplate } from './lib/actions/create-a-video-from-a-template';
import { createVideo } from './lib/actions/create-video';
import { newVideoReady } from './lib/triggers/new-video-ready';

export const synthesia = createPiece({
  displayName: 'Synthesia',
  auth: synthesiaAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/synthesia.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description: 'Create AI videos from text in minutes using Synthesia',
  authors: ['sanket-a11y'],
  actions: [createAVideoFromATemplate, createVideo],
  triggers: [newVideoReady],
});
