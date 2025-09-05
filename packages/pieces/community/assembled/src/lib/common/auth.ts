import { PieceAuth } from '@activepieces/pieces-framework';

export const assembledAuth = PieceAuth.SecretText({
  displayName: 'Assembled API Key',
  description: 'Enter your Assembled API key (Bearer token)',
  required: true,
});
