import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { datastoreSearch } from './lib/actions/datastore-search';

const markdownDescription = `
Follow these instructions to get your LLMRails API Key:

1. Visit the following website: https://console.llmrails.com/api-keys.
2. Once on the website, click on create a key.
3. Once you have created a key, copy it and use it for the Api key field on the site.
`;

export const llmrailsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    if (auth.startsWith('api_')) {
      return {
        valid: true,
      };
    }
    return {
      valid: false,
      error: 'Invalid Api Key',
    };
  },
});

export const llmrails = createPiece({
  displayName: 'LLMRails',
  description: 'LLM Rails Platform',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/llmrails.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  authors: ["w95","kishanprmr","MoShizzle","abuaboud"],
  auth: llmrailsAuth,
  actions: [
    datastoreSearch,
    createCustomApiCallAction({
      baseUrl: () => 'https://api.llmrails.com/v1',
      auth: llmrailsAuth,
      authMapping: async (auth) => ({
        'X-API-KEY': auth as string,
      }),
    }),
  ],
  triggers: [],
});
