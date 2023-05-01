import packageJson from '../package.json';
import { createPiece, PieceType } from '@activepieces/pieces-framework';
import { askOpenAI } from './lib/actions/send-prompt';

export const openai = createPiece({
  name: 'openai',
  displayName: 'OpenAI',
  logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
  version: packageJson.version,
  type: PieceType.PUBLIC,
  actions: [askOpenAI],
  authors: ['aboudzein', 'creed983', 'astorozhevsky',],
  triggers: [],
});
