import { PieceAuth } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const fragmentAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: `You can obtain your API token by navigating to [Developer Settings](https://app.onfragment.com/settings/account/developers).`,
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
        error: 'Invalid API token. Please check your API token and try again.',
      };
    }
  },
});

