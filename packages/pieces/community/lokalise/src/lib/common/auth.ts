import { PieceAuth } from '@activepieces/pieces-framework';

export const lokaliseAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description:
    'Lokalise API Token. You can generate one from your Lokalise account.',
  required: true,
});
