import { PieceAuth } from '@activepieces/pieces-framework';

import { validateGetResponseApiKey } from './client';

export const getresponseAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in to your GetResponse account.
2. Open **Tools > Integrations and API > API**.
3. Create or copy an API key.
4. Paste the key here.

The key will be sent as \`X-Auth-Token: api-key <your_key>\`.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await validateGetResponseApiKey(auth);
      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key.',
      };
    }
  },
});
