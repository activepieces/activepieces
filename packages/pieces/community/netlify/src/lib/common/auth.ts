import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';

const markdownDescription = `
To get your Personal Access Token:

1. Log in to your Netlify account
2. Go to **User Settings** > **Applications** > **Personal Access Tokens**
3. Click **New access token**
4. Give it a descriptive name and click **Generate token**
5. Copy the token and paste it here

For more information, visit the [Netlify API documentation](https://docs.netlify.com/api/get-started/).
`;

export const netlifyAuth = PieceAuth.SecretText({
  displayName: 'Personal Access Token',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.netlify.com/api/v1/user',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
      });

      if (response.status === 200) {
        return {
          valid: true,
        };
      } else {
        return {
          valid: false,
          error: 'Invalid Personal Access Token or insufficient permissions',
        };
      }
    } catch (error: any) {
      return {
        valid: false,
        error: error.response?.body?.message || 'Failed to validate Personal Access Token',
      };
    }
  },
});
