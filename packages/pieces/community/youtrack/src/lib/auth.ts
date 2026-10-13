import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const youtrackAuth = PieceAuth.CustomAuth({
  displayName: 'YouTrack Connection',
  description:
    'Connect your YouTrack instance.\n\n' +
    '**How to get your permanent token:**\n' +
    '1. Log in to your YouTrack instance\n' +
    '2. Click your avatar -> **Profile** -> **Authentication** tab\n' +
    '3. Click **New permanent token**\n' +
    '4. Name it (e.g. "Activepieces") and click **Create**\n' +
    '5. **Copy the token immediately** - it is shown only once\n' +
    '6. Paste it below with your Instance URL\n\n' +
    'Your **Instance URL** is your browser address, e.g. https://example.youtrack.cloud',
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Instance URL',
      description: 'Your YouTrack URL (e.g. https://example.youtrack.cloud). Do NOT include /api.',
      required: true,
    }),
    apiToken: PieceAuth.SecretText({
      displayName: 'Permanent Token',
      description: 'From Profile -> Authentication -> Permanent Tokens. Starts with "perm:".',
      required: true,
    }),
  },
});
