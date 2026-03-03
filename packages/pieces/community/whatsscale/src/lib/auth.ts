import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const whatsscaleAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
    To obtain your API key:

    1. Log in to your WhatsScale account at https://whatsscale.com/dashboard
    2. Navigate to the API Keys section
    3. Copy your API key and paste it here
  `,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://proxy.whatsscale.com/api/auth/test',
        headers: {
          'X-Api-Key': auth as string,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});
