import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './common/props';

export const motionAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `You can obtain API key from [API Settings](https://app.usemotion.com/web/settings/api).`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BASE_URL}/workspaces`,
        headers: {
          'X-API-Key': auth,
        },
      });

      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key.',
      };
    }
  },
});
