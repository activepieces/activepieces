import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const videogenAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Sign in at https://app.videogen.io/api, create an API key, and paste it here. This connection acts as the team that owns the key. Generation uses your VideoGen credits.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({method: HttpMethod.GET, url: 'https://api.videogen.io/v1/account/me', headers: {Authorization: `Bearer ${auth}`}});
      return {valid: true};
    } catch {
      return {valid: false, error: 'Unable to validate the VideoGen API key. Check the key and try again.'};
    }
  },
});
