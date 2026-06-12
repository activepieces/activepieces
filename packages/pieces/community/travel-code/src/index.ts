import {
  OAuth2PropertyValue,
  PieceAuth,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import {
  createCustomApiCallAction,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { travelCodeCommon } from './lib/common';
import { listAirports } from './lib/actions/list-airports';
import { listAirlines } from './lib/actions/list-airlines';
import { getCurrentUser } from './lib/actions/get-current-user';

const travelCodeAuthDescription = `
To connect Travel Code, follow these steps:
1. Contact your Travel Code account manager or support (https://travel-code.com) to register an OAuth 2.0 application.
2. Set the redirect URL of your OAuth application to the one shown above.
3. Copy the **Client ID** and **Client secret** and paste them above.

API documentation: https://apidocs.travel-code.com
`;

export const travelCodeAuth = PieceAuth.OAuth2({
  description: travelCodeAuthDescription,
  authUrl: 'https://travel-code.com/oauth/authorize',
  tokenUrl: 'https://travel-code.com/oauth/token',
  required: true,
  pkce: true,
  pkceMethod: 'S256',
  scope: [
    'airports:read',
    'airlines:read',
    'flights:search',
    'flights:stats',
    'flights:status',
  ],
  validate: async ({ auth }) => {
    const authValue = auth as OAuth2PropertyValue;
    if (!authValue.access_token) {
      return { valid: false, error: 'No access token found' };
    }

    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${travelCodeCommon.baseUrl}/user/me`,
        headers: {
          Authorization: `Bearer ${authValue.access_token}`,
        },
      });

      if (response.status === 200) {
        return { valid: true };
      }

      return { valid: false, error: 'Invalid or expired access token' };
    } catch {
      return { valid: false, error: 'Failed to validate authentication credentials' };
    }
  },
});

export const travelCode = createPiece({
  displayName: 'Travel Code',
  description:
    'Corporate travel platform — search flights, hotels, and trains, and look up travel reference data',
  auth: travelCodeAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.travel-code.com/images/seo/apple-touch-icon-180x180.png',
  categories: [PieceCategory.PRODUCTIVITY],
  authors: ['egorceo'],
  actions: [
    listAirports,
    listAirlines,
    getCurrentUser,
    createCustomApiCallAction({
      baseUrl: () => travelCodeCommon.baseUrl,
      auth: travelCodeAuth,
      authMapping: async (auth) => {
        const authValue = auth as OAuth2PropertyValue;
        return {
          Authorization: `Bearer ${authValue.access_token}`,
        };
      },
    }),
  ],
  triggers: [],
});
