import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { PieceAuth } from '@activepieces/pieces-framework';

export const canvaAuth = PieceAuth.OAuth2({
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://www.canva.com/api/oauth/token',
  required: true,
  scope: [
    'asset:read',
    'asset:write',
    'design:content:read',
    'design:content:write',
    'design:meta:read',
    'folder:read',
    'folder:write',
  ],
  validate: async ({ auth }) => {
    try {
      await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.canva.com/rest/v1/users/me/profile',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.access_token,
        },
      });
      return { valid: true };
    } catch (e) {
      return { valid: false, error: (e as Error).message };
    }
  },
});
