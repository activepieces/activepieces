import packageJson from '../package.json';
import { createPiece } from '@activepieces/pieces-framework';
import { askOpenAI } from './lib/actions/send-prompt';

export const openai = createPiece({
  name: 'openai',
  displayName: 'OpenAI',
  description: 'Use ChatGPT to generate text',
  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  version: packageJson.version,
  actions: [askOpenAI],
  authors: ['aboudzein', 'creed983', 'astorozhevsky',],
  triggers: [],
});
