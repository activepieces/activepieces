import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { BASE_URL } from './constants';

export const altTextAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `You can obtain your API key from [Account Settings](https://alttext.ai/account/api_keys).`,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: BASE_URL + '/account',
        headers: {
          'X-API-Key': auth,
          Accept: 'application/json',
        },
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof HttpError && (error.response.status === 401 || error.response.status === 403)) {
        return { valid: false, error: 'Invalid API Key' };
      }
      const status = error instanceof HttpError ? ` (status ${error.response.status})` : '';
      return {
        valid: false,
        error: `Could not reach AltText.ai to verify the API key${status}. Please try again.`,
      };
    }
  },
});
