import { PieceAuth } from '@activepieces/pieces-framework';

export const fireberryAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Enter your Fireberry API Key. You can generate it from your Fireberry account settings.',
  required: true,
});
