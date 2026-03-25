import {
  AuthenticationType,
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { askOpenRouterAction } from './lib/actions/ask-open-router';
import { openRouterAuth } from './lib/auth';

const markdownDescription = `
Follow these instructions to get your OpenAI API Key:

1. Visit the following website: https://openrouter.ai/keys.
2. Once on the website, click on create a key.
3. Once you have created a key, copy it and use it for the Api key field on the site.
`;
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
