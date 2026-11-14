import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

export const feedjoltAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your Feedjolt workspace API key:
1. Log in to your Feedjolt workspace at https://app.feedjolt.com
2. Open **Settings → API Keys**
3. Create a workspace API key (it starts with \`fjk_\`)
4. Copy the key and paste it here

The key is sent as \`Authorization: Bearer <key>\`. See https://www.feedjolt.com/en/docs/developers`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.feedjolt.com/api/v1/workspaces',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key. Use a workspace key that starts with fjk_.',
      };
    }
  },
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<FeedjoltWorkspace[]>({
        method: HttpMethod.GET,
        url: 'https://api.feedjolt.com/api/v1/workspaces',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      const first = response.body[0];
      if (!first) {
        return undefined;
      }
      return first.name || first.slug;
    } catch {
      return undefined;
    }
  },
});

type FeedjoltWorkspace = {
  name?: string;
  slug?: string;
};
