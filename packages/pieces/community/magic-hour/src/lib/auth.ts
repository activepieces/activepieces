import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { magicHourCommon } from './common';

export const magicHourAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `1. Sign in at https://magichour.ai/developer (free: 400 credits on signup plus 100 per day, no card needed).
2. Click **Create API Key** and copy the key.
3. Paste it here.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${magicHourCommon.baseUrl}/video-projects/activepieces-auth-check`,
        headers: { Authorization: `Bearer ${auth}` },
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof HttpError && error.response.status === 404) {
        return { valid: true };
      }
      return { valid: false, error: 'Invalid API key.' };
    }
  },
});
