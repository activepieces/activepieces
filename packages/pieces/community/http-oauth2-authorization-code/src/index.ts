import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { OAuth2GrantType } from "@activepieces/shared";
import { httpRequestWithOauth2 } from "./lib/actions/http-request-with-oauth2";

export const auth = PieceAuth.OAuth2({
  description: 'OAuth2 - Authorization Code',
  authUrl: '{authUrl}',
  tokenUrl: '{tokenUrl}',
  required: true,
  scope: '{scopes}'.split(' '),
  props: {
    authUrl: Property.ShortText({
      displayName: 'Authorize URL',
      required: true,
      description: 'OAuth2 Authorize URL',
    }),
    tokenUrl: Property.ShortText({
      displayName: 'Token URL',
      required: true,
      description: 'OAuth2 Token URL',
    }),
    scopes: Property.ShortText({
      displayName: 'Scopes (whitespace separated)',
      required: true,
      description: 'OAuth2 Scopes',
    }),
  },
  grantType: OAuth2GrantType.AUTHORIZATION_CODE,
});

export const httpOauth2ClientCredentials = createPiece({
  displayName: "HTTP Request - OAuth2 Authorization Code",
  auth: auth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: "https://cdn.activepieces.com/pieces/http.png",
  authors: [
    'mhshiba'
  ],
  actions: [
    httpRequestWithOauth2,
  ],
  triggers: [],
});
