import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const BLAND_AI_BASE_URL = 'https://api.bland.ai/v1';

export const blandAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Log in to your [Bland AI dashboard](https://app.bland.ai)
2. Go to **Profile** (bottom-left menu) -> **Settings**
3. Click **API Keys** and copy your key`,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BLAND_AI_BASE_URL}/calls`,
        headers: {
          authorization: auth,
          'Content-Type': 'application/json',
        },
        queryParams: {
          limit: '1',
        },
      });
      if (response.status === 200) {
        return { valid: true };
      }
      return {
        valid: false,
        error: `Unexpected status: ${response.status}`,
      };
    } catch (e: unknown) {
      const err = e as { response?: { status?: number } };
      if (err.response?.status === 401 || err.response?.status === 403) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your Bland AI account settings.',
        };
      }
      return {
        valid: false,
        error: `Connection failed: ${String(e).slice(0, 100)}`,
      };
    }
  },
});

