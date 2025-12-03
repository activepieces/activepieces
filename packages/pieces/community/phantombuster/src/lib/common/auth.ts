import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { AppConnectionType } from '@activepieces/shared';

const authHelpDescription = `
1. Login to your Pushbullet Dashboard.
2. Go to **https://phantombuster.com/workspace-settings**.
3. change to the **API Keys** tab and **Add API Key**.
4. Copy the API Key to the clipboard and paste it.
`;

export const phantombusterAuth = PieceAuth.SecretText({
  displayName: 'API Token',
  description: authHelpDescription,
  required: true,
  validate: async (auth) => {
    try {
      await makeRequest(
        { secret_text: auth.auth, type: AppConnectionType.SECRET_TEXT },
        HttpMethod.GET,
        '/agents/fetch-all'
      );
      return { valid: true };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid API key or insufficient permissions',
      };
    }
  },
});
