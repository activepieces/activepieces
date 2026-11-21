import { PieceAuth } from '@activepieces/pieces-framework';

export const afforaiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `To get your API key:
1. Log in to your Afforai account.
2. Open **API** in the left panel.
3. Copy the API key shown at the top right.`,
});
