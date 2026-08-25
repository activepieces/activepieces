import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { RENDEX_BASE_URL } from './common';

export const rendexAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Rendex API key. Create one in your dashboard at rendex.dev under API Keys (the free tier includes 500 renders per month).',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${RENDEX_BASE_URL}/v1/credential-check`,
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API key' };
    }
  },
});
