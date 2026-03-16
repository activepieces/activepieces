import { PieceAuth } from '@activepieces/pieces-framework';

export const zerionAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Zerion API key. Get one at https://developers.zerion.io',
  required: true,
});
