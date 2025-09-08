import { PieceAuth } from '@activepieces/pieces-framework';

export const runwareAuth = PieceAuth.SecretText({
  displayName: 'Runware API Key',
  description: `Create or retrieve your API key from the Runware dashboard.`,
  required: true,
});