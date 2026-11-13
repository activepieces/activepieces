import { createPiece, PieceAuth, Property } from "@activepieces/pieces-framework";
import { httpOauth2RequestAction } from "./lib/actions/send-oauth2-http-request";

export const httpOauth2Auth = PieceAuth.OAuth2({
  description: "Copy the authorize URL, token URL and scopes from the provider's API docs. When you sign in through the provider, add the Redirect URL to its app settings.",
  authUrl: '{authUrl}',
  tokenUrl: '{tokenUrl}',
  required: true,
  scope: '{scopes}'.split(' '),
  grantType: 'both_client_credentials_and_authorization_code',
  props: {
    authUrl: Property.ShortText({
      displayName: 'Authorize URL',
      required: true,
      description: 'Where you sign in to approve access.',
    }),
    tokenUrl: Property.ShortText({
      displayName: 'Token URL',
      required: true,
      description: 'Where the access token is requested.',
    }),
    scopes: Property.ShortText({
      displayName: 'Scopes',
      required: true,
      description: 'Separate scopes with spaces.',
    }),
  },
});

export const httpOauth2ClientCredentials = createPiece({
  displayName: "HTTP (OAuth2)",
  auth: httpOauth2Auth,
  minimumSupportedRelease: '0.88.2',
  logoUrl: "https://cdn.activepieces.com/pieces/new-core/http.svg",
  authors: [
    'mhshiba'
  ],
  actions: [
    httpOauth2RequestAction,
  ],
  triggers: [],
});
