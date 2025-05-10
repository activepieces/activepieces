import {
  PieceAuth,
  OAuth2AuthorizationMethod,
} from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { PCLOUD_API_URL, API_ENDPOINTS } from './common/constants';

export const pcloudAuth = PieceAuth.OAuth2({
  authUrl: 'https://my.pcloud.com/oauth2/authorize',
  tokenUrl: 'https://api.pcloud.com/oauth2_token',
  required: true,
  scope: [],
  extra: {
    response_type: 'code',
  },
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  validate: async ({ auth }) => {
    if (!auth) {
      return {
        valid: false,
        error: 'Access Token is required',
      };
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${PCLOUD_API_URL}${API_ENDPOINTS.USER_INFO}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.access_token,
        },
        queryParams: {
          timeformat: 'timestamp',
        },
      });

      if (response.status === 200) {
        return {
          valid: true,
        };
      }

      return {
        valid: false,
        error: `Invalid Access Token: ${response.status} ${
          response.body?.error || 'Unknown error'
        }`,
      };
    } catch (error) {
      return {
        valid: false,
        error: (error as Error)?.message || 'Invalid Access Token',
      };
    }
  },
});
