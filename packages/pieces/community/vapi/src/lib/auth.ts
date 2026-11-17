import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { VAPI_BASE_URL, VapiApiError, vapiApi } from './common/vapi-api';

export const vapiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
  To obtain your Vapi API key:

  1. Log in to your [Vapi Dashboard](https://dashboard.vapi.ai).
  2. Navigate to **Organization Settings** → **API Keys**.
  3. Copy your Private API key.
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      await vapiApi.request({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/assistant',
        operation: 'connection check',
        query: { limit: 1 },
      });
      return { valid: true };
    } catch (error: unknown) {
      if (error instanceof VapiApiError && (error.status === 401 || error.status === 403)) {
        return {
          valid: false,
          error: `Invalid Vapi API key (status: ${error.status}). Use the Private API key, not the Public key.`,
        };
      }
      const status = error instanceof VapiApiError && error.status > 0 ? error.status : 'unknown';
      return {
        valid: false,
        error: `Could not connect to Vapi API (status: ${status}).`,
      };
    }
  },
});

export { VAPI_BASE_URL };
