import { createPiece } from '@activepieces/pieces-framework';
import packageJson from '../package.json';
import { createCredential } from './lib/actions/create-credential';

export const certopus = createPiece({
  name: 'certopus',
  displayName: 'Certopus',
  logoUrl: 'https://cdn.activepieces.com/pieces/certopus.png',
  version: packageJson.version,
  authors: [],
  actions: [createCredential],
  triggers: [],
});
