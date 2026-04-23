import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const ninjapipeAuth = PieceAuth.CustomAuth({
  displayName: 'NinjaPipe API Connection',
  required: true,
  description: 'Connect to your NinjaPipe workspace.\n\n1. Log in to NinjaPipe and open **Workspace Settings > NinjaPipe API**.\n2. Copy your **API key** (starts with `np_`).\n3. Enter your workspace **API Base URL**. The default is `https://www.ninjapipe.app/api`.',
  props: {
    base_url: Property.ShortText({
      displayName: 'API Base URL',
      description: 'Your workspace API base URL (e.g. https://www.ninjapipe.app/api).',
      required: true,
      defaultValue: 'https://www.ninjapipe.app/api',
    }),
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your workspace API key from NinjaPipe Settings > API.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${auth.base_url}/contacts`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.api_key,
        },
        queryParams: { limit: '1' },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: 'Could not connect to NinjaPipe. Check the Base URL and API Key.' };
    }
  },
});
