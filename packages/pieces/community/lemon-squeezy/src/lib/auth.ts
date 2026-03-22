import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const authDescription = `
To obtain your Lemon Squeezy API key:
1. Log in to your Lemon Squeezy account at [https://app.lemonsqueezy.com](https://app.lemonsqueezy.com)
2. Go to **Settings → API** ([https://app.lemonsqueezy.com/settings/api](https://app.lemonsqueezy.com/settings/api))
3. Click **+ Add new API key**
4. Give your key a name and click **Create API key**
5. Copy the generated key and paste it here

> **Note:** API keys are valid for one year and can be created in both live and test modes.
`;

export const lemonSqueezyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: authDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${LEMON_SQUEEZY_API_BASE}/users/me`,
        headers: {
          Authorization: `Bearer ${auth}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      });
      return { valid: true };
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err?.response?.status === 401) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your Lemon Squeezy API credentials.',
        };
      }
      return {
        valid: false,
        error: 'Unable to validate API key. Please try again.',
      };
    }
  },
});

export const LEMON_SQUEEZY_API_BASE = 'https://api.lemonsqueezy.com/v1';

export function getLemonSqueezyHeaders(apiKey: string): Record<string, string> {
  return {
    Authorization: `Bearer ${apiKey}`,
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
  };
}
