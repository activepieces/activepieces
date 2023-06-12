import { createPiece } from '@activepieces/pieces-framework';
import { createCredential } from './lib/actions/create-credential';

export const certopus = createPiece({
  displayName: 'Certopus',
  logoUrl: 'https://cdn.activepieces.com/pieces/certopus.png',
  authors: ['VrajGohil'],
  actions: [createCredential],
  triggers: [],
});
