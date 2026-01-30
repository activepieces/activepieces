import { PieceAuth } from '@activepieces/pieces-framework';

export const asknewsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Provide your AskNews API key here',
  required: true,
});
