import { PieceAuth } from '@activepieces/pieces-framework';
import { QuickzuAPIClient } from './common/client';

export const quickzuAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: authHelpDescription(),
  required: true,
  validate: async ({ auth }) => {
    try {
      await new QuickzuAPIClient(auth).listCategories();
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API token. Copy it again from Settings > API and Webhooks in Quickzu.',
      };
    }
  },
});

function authHelpDescription() {
  return `
1. Login to your Quickzu Dashboard.
2. Go to **https://app.quickzu.com/dash/settings/api-webhooks**.
3. Copy **API Token** to the clipboard and paste it.`;
}
