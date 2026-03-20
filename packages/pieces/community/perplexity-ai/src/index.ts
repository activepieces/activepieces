import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createChatCompletionAction } from './lib/actions/create-chat-completion.action';
import { perplexityAiAuth } from './lib/auth';

export const perplexityAi = createPiece({
  displayName: 'Perplexity AI',
  auth: perplexityAiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/perplexity-ai.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description: 'AI powered search engine',
  authors: ['kishanprmr','AbdulTheActivePiecer'],
  actions: [createChatCompletionAction],
  triggers: [],
});
