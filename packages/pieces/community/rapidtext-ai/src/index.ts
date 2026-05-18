import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { generateArticleAction } from './lib/actions/generate-article';
import { sendPromptAction } from './lib/actions/send-prompt';
import { rapidTextAiAuth } from './lib/common/auth';

export const rapidtextAi = createPiece({
  displayName: 'RapidText AI',
  auth: rapidTextAiAuth,
  minimumSupportedRelease: '0.36.1',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  logoUrl: 'https://cdn.activepieces.com/pieces/rapidtext-ai.png',
  authors: ['kishanprmr'],
  actions: [generateArticleAction, sendPromptAction],
  triggers: [],
});
