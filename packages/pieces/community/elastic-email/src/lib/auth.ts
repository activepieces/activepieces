import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { ELASTIC_EMAIL_API_BASE } from './common/constants';

export const elasticEmailAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To obtain your Elastic Email API key:
1. Log in to your Elastic Email account
2. Navigate to **Settings → Manage API Keys**
3. Click **Create API Key**
4. Ensure the key has the required permissions (Contacts, Campaigns, Emails, Segments)
5. Copy the key and paste it here
  `,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${ELASTIC_EMAIL_API_BASE}/contacts`,
        headers: {
          'X-ElasticEmail-ApiKey': auth,
        },
        queryParams: { limit: '1' },
      });
      if (response.status === 200) {
        return { valid: true };
      }
      return {
        valid: false,
        error: 'Invalid API key — could not authenticate with Elastic Email.',
      };
    } catch (error: unknown) {
      const statusCode =
        error != null &&
        typeof error === 'object' &&
        'response' in error &&
        error.response != null &&
        typeof error.response === 'object' &&
        'status' in error.response
          ? (error.response as { status: number }).status
          : undefined;

      if (statusCode === 401 || statusCode === 403) {
        return {
          valid: false,
          error: 'Invalid API key — could not authenticate with Elastic Email.',
        };
      }

      return {
        valid: false,
        error:
          'Could not reach the Elastic Email API. Check your network connection and try again.',
      };
    }
  },
});
