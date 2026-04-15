import { PieceAuth, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { MEISTERTASK_API_URL } from './common/common';

export const meistertaskAuth = PieceAuth.OAuth2({
  description: 'Authentication for MeisterTask (uses MindMeister OAuth2)',
  authUrl: 'https://www.mindmeister.com/oauth2/authorize',
  tokenUrl: 'https://www.mindmeister.com/oauth2/token',
  required: true,
  scope: ['userinfo.profile', 'userinfo.email', 'meistertask'],
  validate: async ({ auth }) => {
    const accessToken = (auth as OAuth2PropertyValue).access_token;
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${MEISTERTASK_API_URL}/projects`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: accessToken,
        },
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid token or insufficient scopes.',
      };
    }
  },
});
