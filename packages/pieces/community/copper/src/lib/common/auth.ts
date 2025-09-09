import { PieceAuth } from "@activepieces/pieces-framework";

export const copperAuth = PieceAuth.OAuth2({
  description: `
  To authenticate with Copper:
  
  1. Go to your Copper Developer Console
  2. Create a new application or use an existing one
  3. Configure your application settings:
     - Add \`https://cloud.activepieces.com/redirect\` to the authorized redirect URIs
     - Set the scope to \`developer/v1/all\`
  4. Copy the Client ID and Client Secret
  5. Use the OAuth2 flow below to authenticate
  `,
  authUrl: 'https://app.copper.com/oauth/authorize',
  tokenUrl: 'https://app.copper.com/oauth/token',
  required: true,
  scope: ['developer/v1/all'],
});
