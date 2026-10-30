import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { exaApi } from './common/client';

const markdownDescription = `
Obtain your API key from [Dashboard Setting](https://dashboard.exa.ai/api-keys).
`;

export const exaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await exaApi.call<unknown>({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/agent/runs',
        query: { limit: '1' },
      });
      return { valid: true };
    } catch (e) {
      const status = exaApi.statusOf(e);
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid API Key.' };
      }
      return {
        valid: false,
        error: `Could not verify the API key with Exa${status ? ` (HTTP ${status})` : ''}. Try again in a moment.`,
      };
    }
  },
});
