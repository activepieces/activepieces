import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const pendoAuth = PieceAuth.SecretText({
  displayName: 'Integration Key',
  description:
    'Your Pendo integration key. Found in **Settings → Integrations → Integration Keys**.',
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://app.pendo.io/api/v1/feature',
        headers: {
          'x-pendo-integration-key': auth,
          'Content-Type': 'application/json',
        },
        queryParams: {
          length: '1',
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
          error: 'Invalid integration key. Please check your Pendo settings.',
        };
      }
      return {
        valid: false,
        error: `Connection failed: ${String(e).slice(0, 100)}`,
      };
    }
  },
});
