import { PieceAuth } from '@activepieces/pieces-framework';

export const customgptAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'API Key for CustomGPT',
});
