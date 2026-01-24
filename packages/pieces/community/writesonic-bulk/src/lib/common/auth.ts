import { PieceAuth } from '@activepieces/pieces-framework';

export const writesonicBulkAuth = PieceAuth.SecretText({
  displayName: 'Writesonic Bulk API Key',
  description: `
To get your API Key:

1. Go to [app.writesonic.com](https://app.writesonic.com/)
2. Login to your Writesonic account
3. Hover over your display picture on the top-right corner to open the profile menu
4. Click on "API Dashboard"
5. Click on the switch to activate the API
6. Click on "Reveal API Key"
7. Copy and save your API key securely (never commit to public repositories)
`,
  required: true,
});
