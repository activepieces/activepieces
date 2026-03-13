import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const klaviyoAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your Klaviyo Private API Key:

1. Log into your Klaviyo account at https://www.klaviyo.com
2. Go to **Account** → **Settings** → **API Keys**
3. Click **Create Private API Key**
4. Copy the key and paste it here.

The key should start with \`pk_\`.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://a.klaviyo.com/api/profiles',
        queryParams: {
          'page[size]': '1',
        },
        headers: {
          Authorization: `Klaviyo-API-Key ${auth}`,
          revision: '2023-02-22',
          Accept: 'application/json',
        },
      });
      return { valid: true };
    } catch {
      return { valid: false, error: 'Invalid Klaviyo API Key.' };
    }
  },
});
