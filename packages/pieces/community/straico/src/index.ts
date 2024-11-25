import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  createCustomApiCallAction,
  httpClient,
} from '@activepieces/pieces-common';
import { baseUrl } from './lib/common/common';
import { promptCompletion } from './lib/actions/prompt-completion';
import { imageGeneration } from './lib/actions/image-generation';
import { PieceCategory } from '@activepieces/shared';

const markdownDescription = `
Follow these instructions to get your Straico API Key:

1. Visit the following website: https://platform.straico.com/user-settings.
2. Once on the website, locate "Connect with Straico API" and click on the copy API Key.
`;

export const straicoAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<{
        data: { model: string }[];
      }>({
        url: `${baseUrl}/models`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth as string,
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

export const straico = createPiece({
  displayName: 'Straico',
  auth: straicoAuth,
  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/straico.png',
  categories: [PieceCategory.ARTIFICIAL_INTELLIGENCE],
  description: 'All-in-one generative AI platform',
  authors: ['dennisrongo'],
  actions: [
    promptCompletion,
    imageGeneration,
    createCustomApiCallAction({
      auth: straicoAuth,
      baseUrl: () => baseUrl,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth}`,
        };
      },
    }),
  ],
  triggers: [],
});
