import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from './client';
import { AppConnectionType } from '@activepieces/shared';

export const SoftrAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `You can obtain your API key from [API Settings](https://studio.softr.io/user/apisettings).`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest({
          secret_text: auth,
          type: AppConnectionType.SECRET_TEXT,
        }, HttpMethod.GET, '/databases');
        return {
          valid: true,
        };
      } catch (error) {
        return {
          valid: false,
          error: 'Invalid API Key',
        };
      }
    }
    return {
      valid: false,
      error: 'Invalid API Key',
    };
  },
});
