import { PieceAuth } from '@activepieces/pieces-framework';

export const chainAwareAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Enter your ChainAware API key.',
});
