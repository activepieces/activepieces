import { PieceAuth } from '@activepieces/pieces-framework';

export const tidelyAuth = PieceAuth.SecretText({
  displayName: 'Tidely API Key',
  description: 'Your Tidely API Key. Get it from your Tidely account settings.',
  required: true,
});
