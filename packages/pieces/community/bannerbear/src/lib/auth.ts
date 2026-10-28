import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bannerbearClient } from './common/client';

export const bannerbearAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Your Bannerbear API key. Both key types work:
- **V5 key** (starts with \`bb_ak_v5_\`): in Bannerbear open **Settings → API Keys** and create a key.
- **V2 project key** (older accounts): open your project, then **Settings → API Key**.

Master keys are not supported.`,
  required: true,
  validate: async ({ auth }) => {
    const apiKey = auth.trim();
    const path =
      bannerbearClient.getVersion(apiKey) === 'v5' ? '/account' : '/auth';
    try {
      await bannerbearClient.request({ apiKey, method: HttpMethod.GET, path });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid API key.',
      };
    }
  },
});
