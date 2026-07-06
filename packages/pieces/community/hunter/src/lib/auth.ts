import { PieceAuth } from '@activepieces/pieces-framework';

export const hunterAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'You can obtain your API key from [Account Settings](https://hunter.io/dashboard)',
});
