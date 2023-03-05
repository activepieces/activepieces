import packageJson from '../package.json';
import { createPiece } from '@activepieces/framework';
import { askOpenAI } from './lib/actions/send-prompt';

export const openai = createPiece({
  name: 'openai',
  displayName: 'Open AI',
  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  version: packageJson.version,
  actions: [askOpenAI],
  authors: ['aboudzein', 'creed983'],
  triggers: [],
});
