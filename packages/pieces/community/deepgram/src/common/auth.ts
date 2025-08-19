import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { BASE_URL } from './constants';

export const deepgramAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `You can obtain your API key from [Deepgram Console](https://console.deepgram.com/).`,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: BASE_URL + '/projects',
        headers: {
          Authorization: `Token ${auth as string}`,
        },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Invalid API key.' };
    }
  },
});
