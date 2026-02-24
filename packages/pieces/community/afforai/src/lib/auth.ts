import { PieceAuth } from '@activepieces/pieces-framework';

export const afforaiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
  To obtain your API Key, follow these steps:
  1. Log in to your Afforai account.
  2. Navigate to **API** section on left panel.
  3. On the top-right, you can find you API key.
  `,
});
