import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { askGpt } from './lib/actions/ask-gpt';

const markdownDescription = `

`;

export const azureOpenaiAuth = PieceAuth.CustomAuth({
  description: markdownDescription,
  props: {
    endpoint: Property.ShortText({
        displayName: 'Endpoint',
        required: true
    }),
    apiKey: PieceAuth.SecretText({
        displayName: 'API Key',
        required: true,
    }),
    deploymentId: Property.ShortText({
        displayName: 'Deployment ID',
        required: true,
    }),
  },
  required: true,
});

export type AzureOpenAIAuth = {
    endpoint: string
    apiKey: string
    deploymentId: string
}

export const azureOpenai = createPiece({
  displayName: 'Azure OpenAI',
  auth: azureOpenaiAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/azure-openai.png',
  authors: ['MoShizzle'],
  actions: [
    askGpt,
  ],
  triggers: [],
});
