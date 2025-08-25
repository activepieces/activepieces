import { PieceAuth } from '@activepieces/pieces-framework';

export const vimeoAuth = PieceAuth.OAuth2({
  description: `
    To obtain your OAuth2 credentials:
    
    1. Go to the Vimeo Developer Portal (https://developer.vimeo.com/)
    2. Log in or create a Vimeo account
    3. Click "Create App" and fill in the required information
    4. On your app's settings page, configure:
       - Add \`https://cloud.activepieces.com/redirect\` to the allowed redirect URIs
       - Select all required scopes for your integration
    5. Copy the Client ID and Client Secret
    `,
  authUrl: 'https://api.vimeo.com/oauth/authorize',
  tokenUrl: 'https://api.vimeo.com/oauth/access_token',
  required: true,
  scope: [
    'public',
    'private',
    'interact',
    'upload',
    'delete'
  ],
});
