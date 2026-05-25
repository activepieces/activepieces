import { PieceAuth } from '@activepieces/pieces-framework';

export const postmarkAuth = PieceAuth.SecretText({
    displayName: 'Server Token',
    description: 'You can obtain it from the API Tokens tab under your Postmark server.',
    required: true,
  })