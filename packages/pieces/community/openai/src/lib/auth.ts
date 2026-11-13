import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { baseUrl } from './common/common';

export const openaiAuth = PieceAuth.SecretText({
  description: `To get your API key:

1. Go to https://platform.openai.com/api-keys
2. Click **Create new secret key** and copy it.

Add credit to your OpenAI account first, or every request fails with a 429 quota error.
`,
  displayName: 'API Key',
  required: true,
  validate: async (auth) => {
    try {
      await httpClient.sendRequest<{
        data: { id: string }[];
      }>({
        url: `${baseUrl}/models`,
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key',
      };
    }
  },
});
