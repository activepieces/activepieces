import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export type MoosendAuth = { api_key: string };

export const moosendAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: 'Your Moosend API key. Found in Moosend > Settings > API Key.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://api.moosend.com/v3/lists.json`,
        queryParams: { apikey: auth as string },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key. Please check your Moosend API key.',
      };
    }
  },
});
