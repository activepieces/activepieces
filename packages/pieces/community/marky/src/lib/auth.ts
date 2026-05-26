import { PieceAuth } from '@activepieces/pieces-framework';

import { markyClient } from './common/client';

const markyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Your Marky API key.

You can create API keys from **Settings > API Keys** in your Marky dashboard.`,
  required: true,
  validate: async ({ auth }) => {
    const result = await markyClient.listBusinesses({ apiKey: auth });

    if (!result.ok) {
      return {
        valid: false,
        error: 'Invalid API key. Check the key and try again.',
      };
    }

    return { valid: true };
  },
});

export { markyAuth };
