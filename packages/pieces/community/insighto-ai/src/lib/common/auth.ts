import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const insightoAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Get your API Key from your Insighto.ai dashboard under Settings -> API.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.insighto.ai/v1/user',
        headers: {
          Authorization: `Bearer ${auth}`,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key. Please check the key and try again.',
      };
    }
  },
});
