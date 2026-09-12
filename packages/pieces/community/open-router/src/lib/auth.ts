import { PieceAuth } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod, HttpRequest } from '@activepieces/pieces-common';

const markdownDescription = `
1. Open [openrouter.ai/keys](https://openrouter.ai/keys) and sign in.
2. Click **Create Key**, name it and copy the key.
3. Paste it here. It starts with \`sk-or-\`.
`;

export const openRouterAuth = PieceAuth.SecretText({
  description: markdownDescription,
  displayName: 'API Key',
  required: true,
  validate: async ({ auth }) => {
    try {
      const request: HttpRequest = {
        url: 'https://openrouter.ai/api/v1/auth/key',
        method: HttpMethod.GET,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      };
      await httpClient.sendRequest(request);
      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Invalid API Key',
      };
    }
  },
});
