import { OAuth2AuthorizationMethod, PieceAuth } from '@activepieces/pieces-framework';

export const figmaAuth = PieceAuth.OAuth2({
  description: '',
  authUrl: 'https://www.figma.com/oauth',
  tokenUrl: 'https://api.figma.com/v1/oauth/token',
  required: true,
  scope: ['file_content:read', 'file_metadata:read', 'file_comments:read', 'file_comments:write'],
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
});
