import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { CRW_API_BASE_URL } from './common/common';

const markdownDescription = `
Follow these steps to obtain your fastCRW API Key:

1. Visit [fastCRW](https://fastcrw.com) and create an account (or self-host the open-core binary).
2. Log in and navigate to your dashboard.
3. Locate and copy your API key from the API settings section.

The key is read from your connection; store it under the \`CRW_API_KEY\` convention.
Self-hosted instances may not require a key — point \`CRW_API_BASE_URL\` at your server.
`;

export const crwAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${CRW_API_BASE_URL}/health`,
        headers: {
          'Authorization': `Bearer ${auth}`,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});
