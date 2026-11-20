import { HttpError, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { mailflossApi } from './common/client';

export const mailflossAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in to [mailfloss](https://app.mailfloss.com).
2. Go to **Developers → API keys** and create a key.
3. Copy the key and paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await mailflossApi.send({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/v1/check-key',
      });
      return { valid: true };
    } catch (e) {
      const status = e instanceof HttpError ? e.response.status : undefined;
      if (status === 401) {
        return { valid: false, error: 'Invalid API key.' };
      }
      if (status === 403) {
        return {
          valid: false,
          error:
            'mailfloss refused this API key: it lacks the required permissions or the account is restricted.',
        };
      }
      return {
        valid: false,
        error: 'Could not reach mailfloss to check the API key. Try again.',
      };
    }
  },
});
