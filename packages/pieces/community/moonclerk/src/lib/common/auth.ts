import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const moonclerkAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Moonclerk API Key. You can find it in your Moonclerk account settings. (https://app.moonclerk.com/settings/api-key)',
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      console.log(auth)
      try {
        await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: 'https://api.moonclerk.com/forms',
          headers: {
            Authorization: `Token token=${auth}`,
            Accept: 'application/vnd.moonclerk+json;version=1',
          },
        });
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid API Key or authentication failed.',
        };
      }
    }
    return {
      valid: false,
      error: 'API Key is required.',
    };
  },
});
