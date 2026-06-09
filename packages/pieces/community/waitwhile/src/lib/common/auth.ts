import { PieceAuth } from '@activepieces/pieces-framework';
import { makeRequest } from './client';
import { HttpMethod } from '@activepieces/pieces-common';

export const waitwhileAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your Waitwhile API Key:

1. Go to the [Integrations Settings](https://v2.waitwhile.com/account/integrations) page in your Waitwhile account
2. Create a new API Key (or use an existing one)
3. Copy the API Key and paste it here
 `,
  required: true,
  validate: async ({ auth }) => {
    if (auth) {
      try {
        await makeRequest(auth, HttpMethod.GET, `/locations`);
        return {
          valid: true,
        };
      } catch (e) {
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
