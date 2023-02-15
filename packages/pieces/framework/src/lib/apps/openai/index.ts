import { createPiece } from '../../framework/piece';
import { askOpenAI } from './actions/send-prompt';

export const openai = createPiece({
  name: 'openai',
  displayName: 'Open AI',
  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  actions: [askOpenAI],
  authors: ['aboudzein'],
  triggers: [],
});
