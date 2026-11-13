import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { smartleadRequest, SmartleadApiError } from './common/client';

const markdownDescription = `
To obtain your API key:
1. Log in to your SmartLead account
2. Go to **Settings → API Key**
3. Copy your API key

The API key is passed as a query parameter to all API requests.
`;

export const smartleadAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      await smartleadRequest({
        endpoint: 'campaigns',
        method: HttpMethod.GET,
        apiKey: auth,
      });
      return { valid: true };
    } catch (error: unknown) {
      if (
        error instanceof SmartleadApiError &&
        (error.statusCode === 401 || error.statusCode === 403)
      ) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your SmartLead API credentials.',
        };
      }
      return {
        valid: false,
        error: 'Could not reach SmartLead to validate the API key. Please try again.',
      };
    }
  },
});
