import { createPiece } from '@activepieces/framework';
import { askOpenAI } from './actions/send-prompt';

export const openai = createPiece({
  name: 'openai',
  displayName: 'Open AI',
  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  version: '0.0.0',
  actions: [askOpenAI],
  authors: ['aboudzein', 'creed983'],
  triggers: [],
});
