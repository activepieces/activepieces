import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { runWorkflow } from './lib/actions/run-workflow';
import { burstyAiAuth } from './lib/common/auth';

export const burstyAi = createPiece({
  displayName: 'Bursty-ai',
  auth: burstyAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/bursty-ai.png',
  authors: ['sanket-a11y'],
  actions: [runWorkflow],
  triggers: [],
});
