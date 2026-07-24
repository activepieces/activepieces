import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { nutshellApiCall } from './client';

const authDescription = `
To connect to Nutshell you need your account email and an API key.

1. Log in to Nutshell.
2. Go to **Setup > API keys**.
3. Create (or copy) an API key.

Use your Nutshell login email as the **Email** field, and the API key as the **API Key** field.
`;

export const nutshellAuth = PieceAuth.BasicAuth({
  description: authDescription,
  required: true,
  username: {
    displayName: 'Email',
    description: 'The email address of your Nutshell user.',
  },
  password: {
    displayName: 'API Key',
    description: 'Generated under Setup > API keys in Nutshell.',
  },
  validate: async ({ auth }) => {
    try {
      await nutshellApiCall({
        auth,
        method: HttpMethod.GET,
        resourceUri: '/accounts',
        query: { 'page[limit]': 1 },
      });
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid email or API key',
      };
    }
  },
});
