import { PieceAuth, Property } from '@activepieces/pieces-framework';

import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';

export const ChatAidAuth = PieceAuth.SecretText({
  displayName: 'Chat Aid API Key',
  description: `
    Generate your API key in the dashboard: https://app.chataid.com/settings/automations
`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest(
          auth,
          HttpMethod.GET,
          '/external/sources/custom',
          {}
        );
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid Api Key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid Api Key',
    };
  },
});
