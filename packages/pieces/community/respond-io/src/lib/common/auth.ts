import { PieceAuth } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient, AuthenticationType } from '@activepieces/pieces-common';

const markdownDescription = `
To get your API Access Token:

1. Log in to your Respond.io account
2. Go to **Settings** > **API Access**
3. Click **Generate API Access Token**
4. Copy the token and paste it here

For more information, visit the [Respond.io API documentation](https://developers.respond.io/).
`;

export const respondIoAuth = PieceAuth.SecretText({
  displayName: 'API Access Token',
  description: markdownDescription,
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.respond.io/v2/contact',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth as string,
        },
        queryParams: {
          limit: '1'
        }
      });

      if (response.status === 200) {
        return {
          valid: true,
        };
      } else {
        return {
          valid: false,
          error: 'Invalid API Access Token or insufficient permissions',
        };
      }
    } catch (error: any) {
      return {
        valid: false,
        error: error.response?.body?.message || 'Failed to validate API Access Token',
      };
    }
  },
});
