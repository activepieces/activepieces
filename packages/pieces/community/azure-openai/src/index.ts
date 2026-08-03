import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { askGpt } from './lib/actions/ask-gpt';
import { azureOpenaiAuth } from './lib/auth';

export const azureOpenai = createPiece({
  displayName: 'Azure OpenAI',
  description: 'Powerful AI tools from Microsoft',
  auth: azureOpenaiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/azure-openai.png',
  authors: ["MoShizzle","abuaboud"],
  actions: [
    askGpt,
    createCustomApiCallAction({
      auth: azureOpenaiAuth,
      baseUrl: (auth) => (auth ? auth.props.endpoint : ''),
      authMapping: async (auth) => ({
        'api-key': auth.props.apiKey,
      }),
    }),
  ],
  triggers: [],
});
