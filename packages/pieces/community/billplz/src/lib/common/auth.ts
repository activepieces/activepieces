import { PieceAuth } from '@activepieces/pieces-framework';

export const billplzAuth = PieceAuth.SecretText({
  displayName: 'API Secret Key',
  description: 'Enter your Billplz API Secret Key. You can find this in your Billplz account settings.',
  required: true,
});
