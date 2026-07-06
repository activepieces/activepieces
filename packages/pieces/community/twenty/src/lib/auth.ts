import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const twentyAuth = PieceAuth.CustomAuth({
  description:
    'Connect to your Twenty CRM instance.\n\n' +
    '1. Log in to your Twenty workspace.\n' +
    '2. Go to **Settings** → **APIs & Webhooks**.\n' +
    '3. Click **+ Create API key**, give it a name (e.g. "Activepieces"), and copy the generated key.',
  required: true,
  props: {
    base_url: Property.ShortText({
      displayName: 'Instance URL',
      description:
        'The URL of your Twenty instance (e.g. https://app.twenty.com).',
      required: true,
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      const sanitizedUrl = auth.base_url.replace(/\/$/, '');
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${sanitizedUrl}/rest/people`,
        headers: {
          Authorization: `Bearer ${auth.api_key}`,
        },
        queryParams: {
          'page[size]': '1',
        },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error:
          'Could not connect to Twenty. Please verify your Instance URL and API Key.',
      };
    }
  },
});
