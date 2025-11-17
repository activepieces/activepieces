import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { recallAiAuth } from './lib/common/auth';
import { createBot } from './lib/actions/create-bot';

export const recallAi = createPiece({
  displayName: 'Recall.ai',
  auth: recallAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/recall-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ['sanket-a11y'],
  actions: [createBot],
  triggers: [],
});
