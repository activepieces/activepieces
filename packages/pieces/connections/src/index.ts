
import { createPiece } from '@activepieces/framework';
import packageJson from '../package.json';
import { readConnection } from './lib/actions/read-connection';

export const connections = createPiece({
  name: 'connections',
  displayName: 'Connections',
  logoUrl: 'https://cdn.activepieces.com/pieces/connections.png',
  version: packageJson.version,
  authors: [
    "abuaboud"
  ],
  actions: [
    readConnection
  ],
  triggers: [
  ],
});
