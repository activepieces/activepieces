import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

import { streakRequest } from './common/client';

export const streakAuth = PieceAuth.CustomAuth({
  displayName: 'Streak',
  required: true,
  description: `Create an API key from the Streak sidebar in Gmail → Integrations → API Keys.

Streak's API reference uses HTTP Basic auth with the API key as the username and a blank password.`,
  props: {
    api_key: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Your Streak API key.',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    try {
      await streakRequest({
        apiKey: auth.api_key,
        method: HttpMethod.GET,
        path: '/v1/pipelines',
      });
      return { valid: true };
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 401 || status === 403) {
        return { valid: false, error: 'Invalid API key.' };
      }
      return {
        valid: false,
        error: 'Could not reach the Streak API. Check your API key and network access.',
      };
    }
  },
});
