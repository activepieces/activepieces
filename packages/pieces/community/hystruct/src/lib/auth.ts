import { PieceAuth } from '@activepieces/pieces-framework';

export const hystructAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `
To get your API key:
1. Log in to your Hystruct dashboard
2. Click on your profile picture (top right)
3. Click **Settings**
4. Click **API Keys**
5. Copy and paste your API key here
`,
  required: true,
});
