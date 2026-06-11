import { PieceAuth, httpClient, HttpMethod } from '@activepieces/pieces-framework';
import { AuthenticationType } from '@activepieces/pieces-common';

export const produktlyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `**How to get your Produktly API key:**

1. Sign in to your [Produktly dashboard](https://produktly.com).
2. Open **Settings → [API keys](https://produktly.com/app/settings/private-keys)**.
3. Click **Generate API Key**, give it a name (e.g. "Activepieces") and copy the key.
4. Paste the key below.

**Important:** Treat the key like a password — anyone with it can read and write your Produktly data. The same key works for both REST and MCP.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.produktly.com/api/v1/changelogs',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth,
        },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key. Double-check the key in Produktly Settings → API keys.',
      };
    }
  },
});
