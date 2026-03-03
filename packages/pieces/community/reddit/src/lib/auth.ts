import { PieceAuth, OAuth2AuthorizationMethod } from '@activepieces/pieces-framework';
import { OAuth2GrantType } from '@activepieces/shared';

const markdown = `
To obtain your Reddit API credentials:

1. Go to https://www.reddit.com/prefs/apps.
2. Click "create another app..." at the bottom.
3. Select "script" as the app type.
4. Fill in the required information:
   - name: Your app name
   - description: Brief description
   - about url: Can be left blank
   - redirect uri: as shown in Redirect URL field
5. Click "create app".
6. Note down the client ID (under the app name) and client secret.
`;

export const redditAuth = PieceAuth.OAuth2({
  description: markdown,
  authUrl: 'https://www.reddit.com/api/v1/authorize',
  tokenUrl: 'https://www.reddit.com/api/v1/access_token',
  required: true,
  scope: ['identity', 'read', 'submit', 'edit', 'history', 'flair'],
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  extra: {
    grantType: OAuth2GrantType.AUTHORIZATION_CODE,
    responseType: 'code'
  }
});
