import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const OpenPhoneAuth = PieceAuth.SecretText({
  displayName: 'OpenPhone API Key',
  description: `
  To get your API key:
1. Log in to your OpenPhone account
2. Go to Settings > Integrations > API
3. Generate a new API key
4. Copy the API key and paste it here
`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest(auth as string, HttpMethod.GET, '/teams', {});
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
      error: 'API Key is required',
    };
  },
});
