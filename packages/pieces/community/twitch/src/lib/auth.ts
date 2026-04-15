import { PieceAuth } from '@activepieces/pieces-framework';

export const twitchAuth = PieceAuth.OAuth2({
  description: `
To get your credentials, follow these steps:

1. **Register Your App**
   - Go to [Twitch Developer Console](https://dev.twitch.tv/console)
   - Log in with your Twitch account (or create one if needed)
   - Enable [Two-Factor Authentication](https://www.twitch.tv/settings/security) on your account
   - Navigate to the Applications tab and click "Register Your Application"
   - Set your application name (must be unique)
   - Add an OAuth Redirect URL
   - Select a category for your application
   - Select the Client Type as "Confidential"
   - Click Create

2. **Get Your Credentials**
   - Go to Applications tab and click "Manage" on your app
   - Copy your **Client ID** (public, can be shared)
   - Click "New Secret" to generate a **Client Secret** (keep this confidential)

For more details, visit the [Twitch Authentication Documentation](https://dev.twitch.tv/docs/authentication/register-app/)
  `,

  authUrl: 'https://id.twitch.tv/oauth2/authorize',
  tokenUrl: 'https://id.twitch.tv/oauth2/token',
  required: true,
  scope: [],
});
