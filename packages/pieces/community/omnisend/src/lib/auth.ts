import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { OMNISEND_API_BASE } from './common/client';

const authDescription = `
To obtain your Omnisend API key:
1. Log in to your [Omnisend account](https://app.omnisend.com)
2. Go to **Store settings → Integrations & API → API Keys**
3. Click **Create API Key**, give it a name
4. Copy the generated key and paste it here
`;

export const omnisendAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: authDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${OMNISEND_API_BASE}/brands/current`,
        headers: {
          'X-API-KEY': auth,
          accept: 'application/json',
        },
      });
      return { valid: true };
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your Omnisend API credentials.',
        };
      }
      return {
        valid: false,
        error: 'Unable to validate API key. Please try again.',
      };
    }
  },
});
