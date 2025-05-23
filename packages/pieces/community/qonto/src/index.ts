import { createPiece, PieceAuth, OAuth2PropertyValue } from "@activepieces/pieces-framework";
import { createCustomApiCallAction } from '@activepieces/pieces-common';

export const qontoAuth = PieceAuth.OAuth2({
  description: 'Connect to your Qonto account',
  authUrl: 'https://oauth.qonto.com/oauth2/auth',
  tokenUrl: 'https://oauth.qonto.com/oauth2/token',
  required: true,
  scope: [ // Scopes are predefined here. Ideally, it should be dynamic based on each configuration because the scopes need to be registered in advance on Qonto's side
    'organization.read',
    'team.read',
    'membership.read',
    'membership.write'
  ],
});

export const qonto = createPiece({
  displayName: "Qonto",
  auth: qontoAuth,
  minimumSupportedRelease: '0.0.1',
  logoUrl: "https://cdn.activepieces.com/pieces/qonto.png",
  authors: ["valentin-mourtialon"],
  actions: [
    createCustomApiCallAction({
      baseUrl: () => 'https://thirdparty.qonto.com/v2/',
      auth: qontoAuth,
      authMapping: async (auth) => ({
        Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
      }),
    }),
  ],
  triggers: [],
});