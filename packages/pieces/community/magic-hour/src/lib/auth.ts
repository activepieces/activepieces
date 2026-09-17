import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { magicHourApi } from './common/client';

export const magicHourAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description:
    'Create an API key in the [Magic Hour Developer Hub](https://magichour.ai/developer). Generation actions use account credits.',
  required: true,
  validate: async ({ auth }) => {
    try {
      await magicHourApi.call({
        apiKey: auth,
        method: HttpMethod.GET,
        path: '/account',
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Magic Hour rejected this API key. Check that it is active.',
      };
    }
  },
});
