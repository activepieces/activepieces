import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/shared';

const BASE_URL = 'https://api.lu.ma/public/v1';

async function validateApiKey(apiKey: string) {
  return httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${BASE_URL}/user/get-self`,
    headers: { 'x-luma-api-key': apiKey },
  });
}

export const lumaAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: 'Luma API key from your calendar settings (Settings → API Keys)',
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() => validateApiKey(auth));

    if (error) {
      return {
        valid: false,
        error: 'Invalid API key. Please check your Luma calendar API key.',
      };
    }

    return { valid: true };
  },
});
