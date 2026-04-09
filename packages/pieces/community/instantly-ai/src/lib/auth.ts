import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { tryCatch } from '@activepieces/shared';
import { instantlyClient } from './common/client';

export const instantlyAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'You can obtain an API key from **Settings → Integrations → API Keys** in your Instantly dashboard.',
  required: true,
  validate: async ({ auth }) => {
    const { error } = await tryCatch(() =>
      instantlyClient.makeRequest({
        auth,
        method: HttpMethod.GET,
        path: 'campaigns',
        query: { limit: '1' },
      }),
    );

    if (error) {
      return {
        valid: false,
        error: 'Invalid API key. Please check your Instantly API key.',
      };
    }

    return { valid: true };
  },
});
