import { PieceAuth } from '@activepieces/pieces-framework';

export const bannerbearAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Bannerbear API Key',
  required: true,
});
