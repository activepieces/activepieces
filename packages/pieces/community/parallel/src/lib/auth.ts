import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { parallelClient } from './common/client';

export const parallelAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
**Get your Parallel API key:**

1. Sign in at https://platform.parallel.ai
2. Navigate to **API Keys**
3. Create a new key and paste it here.
  `,
  validate: async ({ auth }) => {
    try {
      await parallelClient.request({
        apiKey: auth,
        method: HttpMethod.POST,
        path: '/v1/search',
        body: {
          objective: 'API key validation',
          search_queries: ['parallel ai api'],
          mode: 'basic',
          max_chars_total: 100,
        },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API key' };
    }
  },
});
