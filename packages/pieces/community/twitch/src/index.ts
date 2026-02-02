import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { streamStarted } from './lib/triggers/stream-started';
import { createCustomApiCallAction } from '@activepieces/pieces-common';

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
export const twitch = createPiece({
  displayName: 'Twitch',
  auth: twitchAuth,
  minimumSupportedRelease: '0.36.1',
  logoUrl: 'https://cdn.activepieces.com/pieces/twitch.png',
  authors: ['arinmakk', 'sanket-a11y'],
  description:
    "Twitch is the world's leading live streaming platform for gamers and the things we love!",
  actions: [
    createCustomApiCallAction({
      auth: twitchAuth,
      baseUrl: () => `https://api.twitch.tv/helix`,
      authMapping: async (auth) => {
        return {
          Authorization: `Bearer ${auth.access_token}`,
          'Content-Type': 'application/json',
          'Client-ID': auth.client_id,
        };
      },
    }),
  ],
  triggers: [streamStarted],
});
