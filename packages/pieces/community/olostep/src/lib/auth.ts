import { PieceAuth } from '@activepieces/pieces-framework';

export const olostepAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Your Olostep API key.',
});