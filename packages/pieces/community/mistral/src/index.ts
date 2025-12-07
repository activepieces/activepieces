import {
  AuthenticationType,
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createChatCompletion } from './lib/actions/chat-completion';
import { createEmbeddings } from './lib/actions/create-embeddings';
import { uploadFile } from './lib/actions/upload-file';
import { listModels } from './lib/actions/list-models';
import { baseUrl } from './lib/common';

export const mistralAuth = PieceAuth.SecretText({
  description: 'Enter your Mistral AI API Key',
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url: `${baseUrl}/models`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});

export const mistral = createPiece({
  displayName: 'Mistral AI',
  description: 'Integrate with Mistral AI for chat completions, embeddings, and more',
  minimumSupportedRelease: '0.63.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mistral.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  auth: mistralAuth,
  actions: [
    createChatCompletion,
    createEmbeddings,
    uploadFile,
    listModels,
    createCustomApiCallAction({
      auth: mistralAuth,
      baseUrl: () => baseUrl,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.secret_text}`,
        };
      },
    }),
  ],
  authors: ['activepieces'],
  triggers: [],
});
