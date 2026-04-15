import { PieceAuth } from '@activepieces/pieces-framework';

const authHelpDescription = `
1. Login to your Quickzu Dashboard.
2. Go to **https://app.quickzu.com/dash/settings/api-webhooks**.
3. Copy **API Token** to the clipboard and paste it.`;

export const quickzuAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: authHelpDescription,
  required: true,
});
