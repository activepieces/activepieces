import { PieceAuth } from '@activepieces/pieces-framework';

import { validateShopSavvyAuth } from './client';

export const shopsavvyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Your ShopSavvy API key.

To get your API key:
1. Visit [shopsavvy.com/data](https://shopsavvy.com/data)
2. Sign up and create an API key
3. Copy the key (starts with \`ss_live_\`) and paste it below.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await validateShopSavvyAuth(auth);
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid API key.' };
    }
  },
});
