import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { contextfetchApi } from './common/client';

const markdownDescription = `
Follow these steps to get a ContextFetch API key:

1. Get a free key with 2,500 credits by running \`curl -X POST https://api.contextfetch.dev/v1/keys/free\` (one per network, no signup), or buy credits at [contextfetch.dev](https://contextfetch.dev/pricing).
2. Copy the key (it starts with \`cf_\`) and paste it here.
`;

export const contextfetchAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await contextfetchApi.request({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/v1/balance',
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: e instanceof Error ? e.message : 'Invalid API Key',
      };
    }
  },
});
