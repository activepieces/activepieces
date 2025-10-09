import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const serpstatAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `You can obtain your API token from your Serpstat account. Go to your Serpstat dashboard and navigate to API settings to get your token.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.serpstat.com/v4/',
        queryParams: {
          token: auth,
        },
      });
      return { valid: true };
    } catch (error: any) {
      if (error.response?.status === 401) {
        return {
          valid: false,
          error: 'Invalid API token. Please check your token and try again.',
        };
      }
      return {
        valid: false,
        error: 'Authentication failed. Please check your API token.',
      };
    }
  },
}); 