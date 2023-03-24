
import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { triggers } from './lib/triggers';

export const shopify = createPiece({
  name: 'shopify',
  displayName: 'Shopify',
  logoUrl: 'https://cdn.activepieces.com/pieces/shopify.png',
  version: packageJson.version,
  authors: [
  ],
  actions: [
  ],
  triggers: triggers,
});
