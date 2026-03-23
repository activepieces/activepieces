import { PieceAuth } from '@activepieces/pieces-framework';

export const veroAuth = PieceAuth.SecretText({
  displayName: 'Auth Token',
  description: 'Vero auth token',
  required: true,
});
