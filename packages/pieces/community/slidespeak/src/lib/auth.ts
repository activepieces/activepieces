import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './common/constants';

export const slidespeakAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `You can obtain your API key by navigating to [API Settings](https://app.slidespeak.co/settings/developer).`,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        url: BASE_URL + '/me',
        method: HttpMethod.GET,
        headers: {
          'X-API-key': auth,
        },
      });

      return {
        valid: true,
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});
