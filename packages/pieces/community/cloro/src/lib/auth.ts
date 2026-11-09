import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { cloroApi } from './common/client';

export const cloroAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in to the [cloro dashboard](https://dashboard.cloro.dev/api-keys).
2. Go to **API Keys** and create a key.
3. Copy the key and paste it here.

The free plan includes 500 credits each month.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await cloroApi.send({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/v1/credits',
      });
      return { valid: true };
    } catch (e) {
      const status = e instanceof HttpError ? e.response.status : undefined;
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid API key.' };
      }
      return {
        valid: false,
        error: 'Could not reach cloro to check the API key. Try again.',
      };
    }
  },
});
