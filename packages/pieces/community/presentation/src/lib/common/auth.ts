import { PieceAuth } from '@activepieces/pieces-framework';
import { presentonClient } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const presentonAuth = PieceAuth.SecretText({
  displayName: 'Presenton API Key',
  description:
    'Your Presenton API key. Create one from your account at https://presenton.ai.',
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await presentonClient.request({
          auth: auth as string,
          method: HttpMethod.GET,
          path: '/api/v1/ppt/presentation/all',
        });
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid Api Key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid Api Key',
    };
  },
});
