import { HttpMethod } from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';

export const appfollowAuth = PieceAuth.SecretText({
  displayName: 'Appfollow API Key',
  description: `
To get your API Key:

1. Go to [Appfollow platform](https://watch.appfollow.io/apps/)
2. Sign up or log in to your account
3. Click on the "Integrations" from  the left sidebar
4. Navigate to the "API Dashboard" section
5. Create a new API token or the use existing one
6. Copy and save your API token
`,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest(auth, HttpMethod.GET, '/account/users');
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
