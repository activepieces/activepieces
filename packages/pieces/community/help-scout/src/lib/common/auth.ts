import { PieceAuth } from '@activepieces/pieces-framework';

export const helpScoutAuth = PieceAuth.OAuth2({
  description: `
  1. Click on your profile icon at the top right and select **Your Profile**.
  2. Go to **My Apps** and click on **Create App**.
  3. Provide **App Name** and use below redirect URL.
  4. Copy the **App ID** and **App Secret**, and provide them as the **Client ID** and **Client Secret**, respectively.`,
  authUrl: 'https://secure.helpscout.net/authentication/authorizeClientApplication',
  tokenUrl: 'https://api.helpscout.net/v2/oauth2/token',
  required: true,
  scope:[]
}); 