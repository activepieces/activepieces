import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const ynabAuth = PieceAuth.SecretText({
  displayName: 'Personal Access Token',
  description: `To get your Personal Access Token:
1. Sign in to YNAB at https://app.ynab.com
2. Click your budget name (top left) → **Account Settings**
3. Open **Developer Settings** (or go directly to https://app.ynab.com/settings/developer)
4. Under **Personal Access Tokens**, click **New Token**, enter your password, and click **Generate**
5. Copy the token shown at the top of the page and paste it here`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.ynab.com/v1/user',
        headers: { Authorization: `Bearer ${auth}` },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Personal Access Token. Please generate a new one from YNAB Developer Settings.',
      };
    }
  },
});
