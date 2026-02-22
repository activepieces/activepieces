import { PieceAuth } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';

export const freeAgentAuth = PieceAuth.OAuth2({
  description: 'Connect your FreeAgent account',
  authUrl: 'https://api.freeagent.com/v2/approve_app',
  tokenUrl: 'https://api.freeagent.com/v2/token_endpoint',
  required: true,
  scope: [],
  validate: async (auth) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.freeagent.com/v2/users/me',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.auth.access_token,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Authentication failed. Please check your credentials.',
      };
    }
  },
});
