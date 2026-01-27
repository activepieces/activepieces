import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';

export const chatsistantAuth = PieceAuth.SecretText({
  displayName: 'Chatsistant API Key',
  description: `
To get your API Key:

1. Go to [Chatsistant platform](https://app.chatsistant.com/)
2. Sign up or log in to your account
3. Click on the "Account" menu in the navigation bar
4. Navigate to the "API Keys" section
5. Click "Generate new key"
6. Enter a description for your key and click "Generate"
7. Copy and save your API key securely
`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest(auth, HttpMethod.GET, '/chatbots', {});
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
