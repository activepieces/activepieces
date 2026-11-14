import { createPiece } from '@activepieces/pieces-framework';
import { createCustomApiCallAction } from '@activepieces/pieces-common';
import { askGpt } from './lib/actions/ask-gpt';
import { azureOpenaiAuth } from './lib/auth';

export const azureOpenai = createPiece({
  displayName: 'Azure OpenAI',
  description: 'Powerful AI tools from Microsoft',
  auth: azureOpenaiAuth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: 'https://cdn.activepieces.com/pieces/azure-openai.png',
  authors: ["MoShizzle","abuaboud"],
  actions: [
    askGpt,
    createCustomApiCallAction({
      auth: azureOpenaiAuth,
      props: {
        url: {
          description: 'Full URL, or a path relative to your Azure OpenAI endpoint.',
          placeholder: '/openai/models',
        },
        queryParams: {
          description: 'Most Azure paths need api-version, e.g. 2024-10-21.',
        },
      },
      baseUrl: (auth) => (auth ? auth.props.endpoint : ''),
      authMapping: async (auth) => ({
        'api-key': auth.props.apiKey,
      }),
    }),
  ],
  triggers: [],
});
