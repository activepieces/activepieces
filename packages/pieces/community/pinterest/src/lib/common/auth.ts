import {
  PieceAuth,
  OAuth2AuthorizationMethod,
} from '@activepieces/pieces-framework';

export const pinterestAuth = PieceAuth.OAuth2({
  description: 'Connect your Pinterest Business Account',
  authUrl: 'https://www.pinterest.com/oauth/',
  tokenUrl: 'https://api.pinterest.com/v5/oauth/token',
  required: true,
  scope: [
    'ads:read',
    'boards:read',
    'boards:write',
    'boards:read_secret',
    'pins:read',
    'pins:write',
    'pins:read_secret',
    'user_accounts:read',
  ],
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
});
