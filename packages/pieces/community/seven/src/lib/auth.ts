import { PieceAuth } from '@activepieces/pieces-framework';

export const sevenAuth = PieceAuth.SecretText({
  description:
    'You can find your API key in [Developer Menu](https://app.seven.io/developer).',
  displayName: 'API key',
  required: true,
});
