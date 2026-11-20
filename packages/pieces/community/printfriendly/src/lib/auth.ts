import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { PrintFriendlyApiError, printfriendlyApi } from './common/client';
import type { UsageResponse } from './common/types';

export const printfriendlyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `To get your API key:
1. Sign in to [PrintFriendly](https://www.printfriendly.com/login) or create a free account.
2. Open your [API key page](https://www.printfriendly.com/me/api-key).
3. Copy the key and paste it here. The free plan includes 100 documents per month.`,
  required: true,
  validate: async ({ auth }) => {
    try {
      await printfriendlyApi.call<UsageResponse>({
        apiKey: auth,
        method: HttpMethod.GET,
        path: printfriendlyApi.usagePath,
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof PrintFriendlyApiError) {
        if (error.status === 401 || error.status === 403) {
          return {
            valid: false,
            error:
              'Invalid API key. Copy the key from your PrintFriendly API key page and try again.',
          };
        }
        if (error.status === 402 || error.status === 429) {
          return { valid: true };
        }
        return { valid: false, error: error.message };
      }

      return {
        valid: false,
        error:
          'Could not connect to PrintFriendly. Check your network and try again.',
      };
    }
  },
});
