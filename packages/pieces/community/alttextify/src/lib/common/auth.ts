import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { ALTTEXTIFY_BASE_URL, verifiedTlsDispatcher } from './client';

export const alttextifyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description:
    'To obtain an API key, navigate to the [API keys](https://alttextify.net/settings/apikeys) section within your account settings.',
  validate: async ({ auth }) => {
    try {
      const dispatcher = await verifiedTlsDispatcher();
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${ALTTEXTIFY_BASE_URL}/image`,
        headers: { 'X-API-Key': auth, Accept: 'application/json' },
        queryParams: { page: '1', limit: '1' },
      }, { dispatcher });
      return { valid: true };
    } catch (error) {
      if (error instanceof HttpError && error.response.status === 401) {
        return { valid: false, error: 'Invalid API key. Copy the key from your AltTextify account settings.' };
      }
      return {
        valid: false,
        error: 'Could not reach AltTextify to check the API key. Try again in a moment.',
      };
    }
  },
});
