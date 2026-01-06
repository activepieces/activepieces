import { PieceAuth } from '@activepieces/pieces-framework';

export const waitwhileAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Waitwhile API Key',
  required: true,
});
