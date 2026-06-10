import { PieceAuth } from '@activepieces/pieces-framework';

export const respaidAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'You can find API Key in your Respaid account',
});
