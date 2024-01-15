import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { createCredential } from './lib/actions/create-credential';

export const certopusAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API key acquired from your Certopus profile',
});

export const certopus = createPiece({
  displayName: 'Certopus',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/certopus.png',
  authors: ['VrajGohil'],
  auth: certopusAuth,
  actions: [createCredential],
  triggers: [],
});
