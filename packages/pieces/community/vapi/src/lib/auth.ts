import { PieceAuth } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';

export const VAPI_BASE_URL = 'https://api.vapi.ai';


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
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${VAPI_BASE_URL}/call?limit=1`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return { valid: true };
    } catch (error: unknown) {
      return {
        valid: false,
        error: `Could not connect to Vapi API (status: ${
          status ?? 'unknown'
        }).`,
      };
    }
  },
});
