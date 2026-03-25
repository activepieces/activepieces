import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';

const VAPI_BASE_URL = 'https://api.vapi.ai';

export { VAPI_BASE_URL };

export const vapiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
  To obtain your Vapi API key:

  1. Log in to your [Vapi Dashboard](https://dashboard.vapi.ai).
  2. Navigate to **Organization Settings** → **API Keys**.
  3. Copy your Private API key (starts with a UUID or token string).
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${VAPI_BASE_URL}/call?limit=1`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      if (response.status === 200) {
        return { valid: true };
      }
      return { valid: false, error: 'Unexpected response from Vapi API.' };
    } catch (error: unknown) {
      const err = error as { response?: { status?: number } };
      const status = err.response?.status;
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid API key.' };
      }
      return {
        valid: false,
        error: `Could not connect to Vapi API (status: ${status ?? 'unknown'}).`,
      };
    }
  },
});
