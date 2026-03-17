import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';

export const openmicAiAuth = PieceAuth.SecretText({
  displayName: 'Openmic AI API Key',
  description: `
To get your Openmic AI API key:
1. Log in to your Openmic dashboard at https://app.openmic.ai
2. Navigate to  API Keys section in the left Navigation
3. Generate a new API key
4. Copy and paste the key here
  `,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest({
          secret_text: auth,
          type: AppConnectionType.SECRET_TEXT,
        }, HttpMethod.GET, '/calls');
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
