import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { askGpt } from './lib/actions/ask-gpt';

export const azureOpenaiAuth = PieceAuth.CustomAuth({
  props: {
    endpoint: Property.ShortText({
      displayName: 'Endpoint',
      description: 'https://<resource name>.openai.azure.com/',
      required: true,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description:
        'Use the Azure Portal to browse to your OpenAI resource and retrieve an API key',
      required: true,
    }),
  },
  required: true,
});

export type AzureOpenAIAuth = {
  endpoint: string;
  apiKey: string;
  deploymentId: string;
};

export const azureOpenai = createPiece({
  displayName: 'Azure OpenAI',
  description: 'Powerful AI tools from Microsoft',
  auth: azureOpenaiAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/azure-openai.png',
  authors: ["MoShizzle","abuaboud"],
  actions: [askGpt],
  triggers: [],
});
