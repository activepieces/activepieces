import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { shortIoClient } from './client';

export const shortIoAuth = PieceAuth.CustomAuth({
  description: 'Enter your Short.io API Key',
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await shortIoClient.request({
        method: HttpMethod.GET,
        auth: { props: { apiKey: auth.apiKey } },
        path: '/api/domains',
        query: { limit: 1 },
      });
      return { valid: true };
    } catch (error) {
      const status = shortIoClient.errorStatus(error);
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid API Key. Use a secret API key from Short.io > Integrations & API; public keys can only create links from a browser.' };
      }
      return {
        valid: false,
        error: `Could not reach Short.io to check the API key: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
  required: true,
});
