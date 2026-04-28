import { PieceAuth } from '@activepieces/pieces-framework';

export const giphyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Giphy API key.',
  required: true,
});

export type GiphyAuth = typeof giphyAuth;
