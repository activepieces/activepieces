import { createPiece } from '@activepieces/pieces-framework';
import { askOpenAI } from './lib/actions/send-prompt';

export const openai = createPiece({
  displayName: 'OpenAI',
  description: 'Use ChatGPT to generate text',
  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  actions: [askOpenAI],
  authors: ['aboudzein', 'creed983', 'astorozhevsky',],
  triggers: [],
});
