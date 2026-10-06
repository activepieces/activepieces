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
  getConnectionIdentifier: async ({ auth }) => {
    try {
      const response = await httpClient.sendRequest<{ user?: FreeAgentUser }>({
        method: HttpMethod.GET,
        url: 'https://api.freeagent.com/v2/users/me',
        headers: {
          Authorization: `Bearer ${auth.access_token}`,
          Accept: 'application/json',
        },
        timeout: 5000,
      });
      const user = response.body.user;
      const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ');
      return user?.email || fullName || undefined;
    } catch {
      return undefined;
    }
  },
});

type FreeAgentUser = {
  email?: string;
  first_name?: string;
  last_name?: string;
};
