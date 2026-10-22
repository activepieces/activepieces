import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { coretoolClient } from './common/client';

export const coretoolAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To connect Coretool:

1. Sign in at [coretool.de](https://coretool.de) (a free account includes free calls).
2. Open your account settings and create a new API key.
3. Copy the key (it starts with \`ct_live_\`, or \`ct_test_\` for test mode) and paste it below.

Test keys create documents marked as test and do not count against your plan.
`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await coretoolClient.request({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/auth/test',
        what: 'Could not verify the API key',
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid API key',
      };
    }
  },
});
