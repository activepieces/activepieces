import { OAuth2AuthorizationMethod, PieceAuth } from '@activepieces/pieces-framework';

export const figmaAuth = PieceAuth.OAuth2({
  description: 'Connect your Figma account. Connections made before version 0.7.0 must be reconnected to use versions, library, current user and trigger steps.',
  authUrl: 'https://www.figma.com/oauth',
  tokenUrl: 'https://api.figma.com/v1/oauth/token',
  required: true,
  scope: [
    'file_content:read',
    'file_metadata:read',
    'file_comments:read',
    'file_comments:write',
    'file_versions:read',
    'library_content:read',
    'current_user:read',
    'webhooks:write',
  ],
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
});
