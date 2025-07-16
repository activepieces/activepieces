import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const helpScoutAuth = PieceAuth.CustomAuth({
  description: `To get your Help Scout API credentials:

1. Log in to your Help Scout account
2. Go to **Manage > Company > Apps**
3. Click **Create My App**
4. Fill in the app details and save
5. Copy your **App ID** and **App Secret**
6. Generate an API Key by going to **Manage > API Keys**
7. Click **Generate API Key** and copy the generated key

Note: Help Scout uses OAuth2 for authentication. The API Key is used for server-to-server authentication.`,
  props: {
    apiKey: Property.ShortText({
      displayName: 'API Key',
      description: 'Your Help Scout API Key',
      required: true,
    }),
    appId: Property.ShortText({
      displayName: 'App ID',
      description: 'Your Help Scout App ID (for OAuth flows)',
      required: false,
    }),
    appSecret: Property.ShortText({
      displayName: 'App Secret',
      description: 'Your Help Scout App Secret (for OAuth flows)',
      required: false,
    }),
  },
  required: true,
  validate: async ({ auth }) => {
    try {
      const response = await fetch('https://api.helpscout.net/v2/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${auth.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return {
          valid: false,
          error: 'Invalid API Key. Please check your credentials.',
        };
      }

      return {
        valid: true,
      };
    } catch (error) {
      return {
        valid: false,
        error: 'Failed to validate API Key. Please check your credentials and try again.',
      };
    }
  },
});