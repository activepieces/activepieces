import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/shared';
import { makeRequest } from './common';

export const cognitoFormsAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: `
  1. Click your organization's name in the top left corner and then click Settings.
  2. Go to the Integrations section and select + New API Key.
  3. Make sure to copy and store your API key, as it cannot be retrieved later.
  `,
  validate: async ({ auth }) => {
    try {
      await makeRequest({secret_text: auth, type: AppConnectionType.SECRET_TEXT}, HttpMethod.GET, '/forms');

      return { valid: true };
    } catch {
      return {
        valid: false,
        error: 'Invalid API Key.',
      };
    }
  },
});
