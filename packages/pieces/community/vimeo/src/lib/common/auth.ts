import { PieceAuth } from '@activepieces/pieces-framework';

const authSetup = `
## How to Get Your Vimeo API Access Token

1. **Log in** to your Vimeo account.  
2. Go to [Vimeo Developer Apps](https://developer.vimeo.com/apps) https://developer.vimeo.com/apps and **create a new app**.  
3. After creating the app, **copy the Client Identifier** and paste it into the **Client ID** field below.  
4. Scroll down, **copy the Client Secret**, and paste it into the **Client Secret** field below.  
5. In the **Your callback URLs** section, **add a new URL**. Use the **Redirect URL** provided below and paste it into the Vimeo callback URL field.  
6. Click **Connect** below and approve access to your Vimeo account.  
7. **Save your settings.**  
`;

export const vimeoAuth = PieceAuth.OAuth2({
  description: authSetup,
  authUrl: 'https://api.vimeo.com/oauth/authorize',
  tokenUrl: 'https://api.vimeo.com/oauth/access_token',
  required: true,
  scope: ['public', 'private', 'upload', 'edit', 'delete'],
});