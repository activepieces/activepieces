import { AppConnectionValueForAuthProperty, PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const markdownDescription = `
**How to get your Wafeq API Key:**

1. Log in to your [Wafeq account](https://app.wafeq.com/accounts/signup/).
2. In the left-side menu, open the **Developer** section and click **API Keys**.
3. Click **Create new key** and copy the key — you won't be able to see it again.
4. Click **Enable API**. The API is available on the **Starter plan** or higher (including free trials).
5. Paste the key below.
`;

export const wafeqAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${WAFEQ_API_BASE_URL}/organization/`,
        headers: {
          Authorization: `Api-Key ${auth}`,
        },
      });
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error:
          'Invalid API Key. Make sure the key is correct and that the API is enabled on your Wafeq plan (Starter or higher).',
      };
    }
  },
});

export const WAFEQ_API_BASE_URL = 'https://api.wafeq.com/v1';
export type WafeqAuth = AppConnectionValueForAuthProperty<typeof wafeqAuth>;