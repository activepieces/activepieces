import {
  AppConnectionValueForAuthProperty,
  PieceAuth,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
**How to get your Qawafel API Key:**

1. Sign in to your [Qawafel dashboard](https://qawafel.sa).
2. Open **Settings → Developers → API Keys**.
3. Click **Create API Key**, give it a name (e.g. "Activepieces") and copy the key.
4. Paste the key below. Keep it secret — anyone with the key can read and write your Qawafel data.

API keys are scoped to a single tenant. Use the **Sandbox** environment for testing without touching live data.
`;

export const qawafelAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${PRODUCTION_API_BASE_URL}/tenant`,
        headers: {
          'x-qawafel-api-key': auth,
        },
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Could not authenticate. Double-check the API Key, and make sure you picked the same environment (Production or Sandbox) the key was created in.',
      };
    }
  },
});

export const PRODUCTION_API_BASE_URL = 'https://core.qawafel.sa/api/v1';
export type QawafelAuth = AppConnectionValueForAuthProperty<typeof qawafelAuth>;
