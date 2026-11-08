import { PieceAuth } from '@activepieces/pieces-framework';

export const parseurAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Create a new API key in Account → API keys in the Parseur app: https://app.parseur.com/account/api-keys',
  required: true,
});
