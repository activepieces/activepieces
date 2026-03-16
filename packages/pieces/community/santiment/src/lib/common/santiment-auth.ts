import { PieceAuth } from '@activepieces/pieces-framework';

export const santimentAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Santiment API key. Get it from https://app.santiment.net/account#api-keys',
  required: true,
});
