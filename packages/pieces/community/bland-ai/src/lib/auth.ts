import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const BLAND_AI_BASE_URL = 'https://api.bland.ai/v1';

export function blandHeaders(apiKey: string): Record<string, string> {
  return {
    authorization: apiKey,
    'Content-Type': 'application/json',
  };
}

export const blandAiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Your Bland AI API key. Find it at https://app.bland.ai/dashboard',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${BLAND_AI_BASE_URL}/calls`,
        headers: blandHeaders(auth),
        queryParams: { limit: '1' },
      });
      if (response.status === 200) {
        return { valid: true };
      }
      return { valid: false, error: 'Unexpected response from Bland AI' };
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response
        ?.status;
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid API key' };
      }
      return {
        valid: false,
        error: `Could not connect to Bland AI: ${String(e)}`,
      };
    }
  },
});
