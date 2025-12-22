import { PieceAuth } from '@activepieces/pieces-framework';

export const neverbounceAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Neverbounce API Key. Get it from https://neverbounce.com/',
  required: true,
});
