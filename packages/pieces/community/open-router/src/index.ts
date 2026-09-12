import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/pieces-framework';
import { askOpenRouterAction } from './lib/actions/ask-open-router';
import { openRouterAuth } from './lib/auth';

export const openRouter = createPiece({
  displayName: 'OpenRouter',
  description: 'Use any AI model to generate code, text, or images via OpenRouter.ai.',
  auth: openRouterAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/open-router.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["Salem-Alaa","kishanprmr","MoShizzle","abuaboud"],
  actions: [
    askOpenRouterAction,
    createCustomApiCallAction({
      baseUrl: () => 'https://openrouter.ai/api/v1',
      auth: openRouterAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${auth.secret_text}`,
      }),
    }),
  ],
  triggers: [],
});
