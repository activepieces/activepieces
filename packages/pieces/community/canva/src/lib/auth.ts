import { OAuth2AuthorizationMethod, PieceAuth } from '@activepieces/pieces-framework';

export const canvaAuth = PieceAuth.OAuth2({
  description:
    'Connect your Canva account. Create an integration at https://www.canva.com/developers/ to obtain your Client ID and Client Secret.',
  authUrl: 'https://www.canva.com/api/oauth/authorize',
  tokenUrl: 'https://www.canva.com/api/oauth/token',
  required: true,
  pkce: true,
  scope: [
    'asset:read',
    'asset:write',
    'design:content:read',
    'design:content:write',
    'design:meta:read',
    'folder:read',
    'folder:write',
    'profile:read',
  ],
  authorizationMethod: OAuth2AuthorizationMethod.BODY,
});
