import {
  PieceAuth,
  OAuth2AuthorizationMethod,
} from '@activepieces/pieces-framework';

const authGuide = `
Connect a Pinterest **business** account.

1. Log in to [Pinterest Developers](https://developers.pinterest.com/apps/) and create an app.
2. In the app settings, add the Redirect URL shown below to the allowed redirect URIs.
3. New apps start with trial access: Pins and boards created through the API stay visible only to you until Pinterest grants standard access.
`;

export const pinterestAuth = PieceAuth.OAuth2({
  description: authGuide,
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
