
import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { newSubscriber } from './lib/triggers';

export const convertkit = createPiece({
  name: 'convertkit',
  displayName: 'ConvertKit',
  logoUrl: 'https://cdn.activepieces.com/pieces/convertkit.png',
  version: packageJson.version,
  authors: [
    "abuaboud"
  ],
  actions: [
  ],
  triggers: [
    newSubscriber
  ],
});
