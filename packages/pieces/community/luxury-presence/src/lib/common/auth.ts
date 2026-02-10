import { PieceAuth } from '@activepieces/pieces-framework';

export const luxuryPresenceAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Generating and Managing API Keys

API Keys can be generated via the dashboard located here, or by following these steps:

1. Login to your Luxury Presence account: app.luxurypresence.com.
2. Click on your profile icon in the bottom left-hand corner.
3. Navigate to Settings > API Keys > Generate Key.
4. Type in a Key Description for your API key to help easily recognize it later.
5. Click Generate Key.
6. Copy your API Key, and store it in a safe place.

You must have the role of admin in your account to be able to manage API Keys.
`,
  required: true,
});
