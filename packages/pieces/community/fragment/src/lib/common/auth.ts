import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const fragmentAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
    To get your API Key:
    1. Log in to your Fragment dashboard.
    2. Navigate to **Settings** > **API**.
    3. Generate and copy your API Key.
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      // Validate by attempting to list tasks
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.onfragment.com/api/v1/tasks',
        headers: {
          'Authorization': `Bearer ${auth}`,
          'Content-Type': 'application/json',
        },
        queryParams: {
          limit: '1',
        },
      });
      return {
        valid: true,
      };
    } catch (error: any) {
      return {
        valid: false,
        error: 'Invalid API Key. Please check your API key and try again.',
      };
    }
  },
});

