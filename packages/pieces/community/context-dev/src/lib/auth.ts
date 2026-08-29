import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

import { contextApiCall } from './common/client';

export const contextDevAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Create or copy an API key from the [Context.dev dashboard](https://www.context.dev/dashboard).',
  required: true,
  validate: async ({ auth }) => {
    try {
      await contextApiCall<MonitorLimitsResponse>({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/monitors/limits',
      });

      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'The API key is invalid or no longer active.',
      };
    }
  },
});

type MonitorLimitsResponse = {
  monitors_used: number;
  monitors_limit: number;
  plan: string;
};
