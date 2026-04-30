import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const DUB_API_BASE = 'https://api.dub.co';

const authDescription = `
To obtain your Dub API key:
1. Go to [https://app.dub.co/settings/tokens](https://app.dub.co/settings/tokens)
2. Click **Create API Key**
3. Give your key a name and select the required scopes
4. Copy the key — it starts with \`dub_\` (e.g. \`dub_xxxxxxxxxxxxxxxx\`)
5. Paste it here

> **Required scopes:** \`links.read\`, \`links.write\`, \`webhooks.write\` (for triggers)
`;

export const dubAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: authDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${DUB_API_BASE}/folders`,
        headers: {
          Authorization: `Bearer ${auth.trim()}`,
          'Content-Type': 'application/json',
        },
      });
      return { valid: true };
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err?.response?.status === 401) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your Dub API credentials.',
        };
      }
      if (err?.response?.status === 403) {
        return {
          valid: false,
          error: 'Insufficient scopes. Ensure your API key has links.read, links.write, and webhooks.write permissions.',
        };
      }
      return {
        valid: false,
        error: 'Unable to validate API key. Please try again.',
      };
    }
  },
});
