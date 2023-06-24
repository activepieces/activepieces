
import { createPiece } from '@activepieces/pieces-framework';
import { readConnection } from './lib/actions/read-connection';

export const connections = createPiece({
  displayName: 'Connections',
  logoUrl: 'https://cdn.activepieces.com/pieces/connections.png',
  authors: [
    "abuaboud"
  ],
  actions: [
    readConnection
  ],
  triggers: [
  ],
});
