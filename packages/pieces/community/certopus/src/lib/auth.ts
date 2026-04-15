import { PieceAuth } from '@activepieces/pieces-framework';

export const certopusAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API key acquired from your Certopus profile',
});
