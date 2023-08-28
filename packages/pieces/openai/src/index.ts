import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { askOpenAI } from './lib/actions/send-prompt';
import { createEmbeddingsFromText } from './lib/actions/generate-embeddings';

const markdownDescription = `
Follow these instructions to get your OpenAI API Key:

1. Visit the following website: https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`

export const openaiAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'Api Key',
  required: true,
})

export const openai = createPiece({
  displayName: 'OpenAI',
  description: 'Use the OpenAI API and there models',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  auth: openaiAuth,
  actions: [askOpenAI, createEmbeddingsFromText],
  authors: ['aboudzein', 'creed983', 'astorozhevsky', 'ArmanGiau'],
  triggers: [],
});
