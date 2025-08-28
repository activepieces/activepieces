import { PieceAuth } from '@activepieces/pieces-framework';

const authGuide = `
### To obtain your Vimeo API access token, follow these steps:

1. Login to your Vimeo account
2. Create your app on Vimeo, navigate to https://developer.vimeo.com/apps
3. After creating the app, copy **Client identifier** and fill it to **Client ID** field below.
4. Scroll down and Copy **Client secrets** and fill it to **Client Secret** field below.
5. Scroll down and find "Your callback URLs" section, and add new URL. Make sure you copy the **Redirect URL** from the field below to Vimeo's redirect URL.
6. Click **Connect** from below and allow access to your account.
7. Save
`;

export const vimeoAuth = PieceAuth.OAuth2({
  description: authGuide,
  authUrl: 'https://api.vimeo.com/oauth/authorize',
  tokenUrl: 'https://api.vimeo.com/oauth/access_token',
  required: true,
  scope: ['public', 'private', 'edit', 'upload', 'delete'],
});